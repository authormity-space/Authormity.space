import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
});

/**
 * Uploads a file buffer to Cloudflare R2.
 * @param key - The object key (path) to store the file under.
 * @param file - The file contents as a Buffer.
 * @param contentType - The MIME type of the file (e.g. "image/png").
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(
    key: string,
    file: Buffer,
    contentType: string
): Promise<string> {
    await r2.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
        })
    );

    return `https://pub-${accountId}.r2.dev/${key}`;
}

/**
 * Deletes a file from Cloudflare R2 by its object key.
 * @param key - The object key of the file to delete.
 */
export async function deleteFile(key: string): Promise<void> {
    await r2.send(
        new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        })
    );
}
