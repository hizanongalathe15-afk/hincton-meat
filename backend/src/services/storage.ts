export const uploadFile = async (
  _file: Buffer,
  _path: string,
  _contentType: string
): Promise<string> => {
  throw new Error('Persistent file storage is not configured. Use Cloudinary for uploads on Render.')
}

export const deleteFile = async (_path: string): Promise<void> => {
  throw new Error('Persistent file storage is not configured. Use Cloudinary for deletes on Render.')
}
