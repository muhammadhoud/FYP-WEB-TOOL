import { google } from 'googleapis';

export interface GoogleDriveService {
  getFileContent(accessToken: string, fileId: string): Promise<{ content: string; mimeType: string; name: string }>;
  getFileMetadata(accessToken: string, fileId: string): Promise<any>;
  getFileDownloadUrl(accessToken: string, fileId: string): Promise<{ downloadUrl: string; name: string; mimeType: string }>;
  downloadFileAsBlob(accessToken: string, fileId: string): Promise<{ blob: Buffer; name: string; mimeType: string }>;
}

class GoogleDriveServiceImpl implements GoogleDriveService {
  private getAuth(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  async getFileContent(accessToken: string, fileId: string): Promise<{ content: string; mimeType: string; name: string }> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: 'v3', auth });
      
      // Get file metadata
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name,mimeType,size',
      });

      const { name, mimeType } = metadataResponse.data;

      // Get file content
      const contentResponse = await drive.files.get({
        fileId,
        alt: 'media',
      });

      return {
        content: contentResponse.data as string,
        mimeType: mimeType || 'application/octet-stream',
        name: name || 'Unknown file',
      };
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content from Google Drive');
    }
  }

  async getFileMetadata(accessToken: string, fileId: string): Promise<any> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink',
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      throw new Error('Failed to fetch file metadata from Google Drive');
    }
  }

  async getFileDownloadUrl(accessToken: string, fileId: string): Promise<{ downloadUrl: string; name: string; mimeType: string }> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: 'v3', auth });
      
      // Get file metadata
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name,mimeType,size',
      });

      const { name, mimeType } = metadataResponse.data;
      
      // Create download URL
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      
      return {
        downloadUrl,
        name: name || 'Unknown file',
        mimeType: mimeType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error creating download URL:', error);
      throw new Error('Failed to create download URL for file');
    }
  }

  async downloadFileAsBlob(accessToken: string, fileId: string): Promise<{ blob: Buffer; name: string; mimeType: string }> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: 'v3', auth });
      
      // Get file metadata
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name,mimeType,size',
      });

      const { name, mimeType } = metadataResponse.data;

      // Get file content as buffer
      const contentResponse = await drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'arraybuffer'
      });

      return {
        blob: Buffer.from(contentResponse.data as ArrayBuffer),
        name: name || 'Unknown file',
        mimeType: mimeType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error downloading file as blob:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }
}

export const googleDriveService = new GoogleDriveServiceImpl();
