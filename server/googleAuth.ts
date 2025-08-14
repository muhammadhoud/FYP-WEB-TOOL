import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip Google OAuth setup if credentials are not provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not found. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable authentication.");
    return;
  }

  // Construct the full callback URL
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:5000`;
  const callbackURL = `${baseUrl}/api/auth/google/callback`;
  
  console.log(`OAuth callback URL: ${callbackURL}`);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const userEmail = profile.emails?.[0]?.value;
          
          // Optional: Restrict to specific email addresses
          const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim());
          if (allowedEmails && allowedEmails.length > 0 && !allowedEmails.includes(userEmail || '')) {
            return done(new Error('Email not authorized'), undefined);
          }

          const user = await storage.upsertUser({
            id: profile.id,
            email: userEmail || null,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          });

          // Store tokens for Google API access
          const userWithTokens = {
            ...user,
            accessToken,
            refreshToken,
            googleId: profile.id,
          };

          done(null, userWithTokens);
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    // Store both user ID and tokens in session
    done(null, {
      id: user.id,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  });

  passport.deserializeUser(async (sessionData: any, done) => {
    try {
      if (typeof sessionData === 'string') {
        // Handle old session format
        const user = await storage.getUser(sessionData);
        if (!user) {
          return done(null, null);
        }
        done(null, user);
        return;
      }

      // Handle new session format with tokens
      const user = await storage.getUser(sessionData.id);
      if (!user) {
        return done(null, null);
      }

      // Restore user with tokens
      const userWithTokens = {
        ...user,
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
      };

      done(null, userWithTokens);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, null);
    }
  });

  // Auth routes - only set up if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/login", passport.authenticate("google", {
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
        "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
        "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/classroom.coursework.students",
      ],
    }));

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/");
      }
    );

    app.get("/api/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.redirect("/");
      });
    });
  } else {
    // Fallback routes when OAuth is not configured
    app.get("/api/login", (req, res) => {
      res.status(503).json({ message: "Authentication not configured. Please add Google OAuth credentials." });
    });
    
    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};