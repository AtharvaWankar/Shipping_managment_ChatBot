// AWS Configuration and Service Initialization
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, CreateBucketCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class AWSConfig {
    constructor() {
        this.accessKeyId = null;
        this.secretAccessKey = null;
        this.region = 'us-east-1'; // Default region
        this.bedrockClient = null;
        this.s3Client = null;
        this.bucketName = 'chat-history';
        this.modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
        this.initialized = false;
    }

    // Initialize AWS clients with credentials
    async initialize(accessKeyId, secretAccessKey, region = 'us-east-1') {
        try {
            this.accessKeyId = accessKeyId || process.env.AWS_ACCESS_KEY_ID;
            this.secretAccessKey = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
            this.region = region;

            if (!this.accessKeyId || !this.secretAccessKey) {
                throw new Error('AWS credentials are required. Please provide access key and secret key.');
            }

            const credentials = {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey
            };

            // Initialize Bedrock Runtime client
            this.bedrockClient = new BedrockRuntimeClient({
                region: this.region,
                credentials: credentials
            });

            // Initialize S3 client
            this.s3Client = new S3Client({
                region: this.region,
                credentials: credentials
            });

            // Create chat history bucket if it doesn't exist
            await this.ensureBucketExists();
            
            this.initialized = true;
            console.log('AWS services initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AWS services:', error);
            throw error;
        }
    }

    // Ensure the chat history bucket exists
    async ensureBucketExists() {
        try {
            const createBucketCommand = new CreateBucketCommand({
                Bucket: this.bucketName
            });
            
            await this.s3Client.send(createBucketCommand);
            console.log(`Bucket ${this.bucketName} created successfully`);
        } catch (error) {
            // Bucket might already exist
            if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') {
                console.error('Error creating bucket:', error);
                // Don't throw error if bucket already exists
            }
        }
    }

    // Invoke Claude model
    async invokeClaude(prompt, maxTokens = 1000) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const body = JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: body
            });

            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            return responseBody.content[0].text;
        } catch (error) {
            console.error('Error invoking Claude model:', error);
            throw new Error('Failed to get response from Claude. Please check your AWS credentials and model access.');
        }
    }

    // Save chat session to S3
    async saveChatSession(sessionId, messages) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const sessionData = {
                sessionId: sessionId,
                timestamp: new Date().toISOString(),
                messages: messages
            };

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: `${sessionId}.json`,
                Body: JSON.stringify(sessionData, null, 2),
                ContentType: 'application/json'
            });

            await this.s3Client.send(command);
            console.log(`Chat session ${sessionId} saved to S3`);
        } catch (error) {
            console.error('Error saving chat session:', error);
            throw new Error('Failed to save chat session to S3');
        }
    }

    // Load chat session from S3
    async loadChatSession(sessionId) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: `${sessionId}.json`
            });

            const response = await this.s3Client.send(command);
            const body = await response.Body.transformToString();
            return JSON.parse(body);
        } catch (error) {
            console.error('Error loading chat session:', error);
            return null;
        }
    }

    // List all chat sessions
    async listChatSessions() {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName
            });

            const response = await this.s3Client.send(command);
            const sessions = [];

            if (response.Contents) {
                for (const object of response.Contents) {
                    const sessionId = object.Key.replace('.json', '');
                    sessions.push({
                        sessionId: sessionId,
                        lastModified: object.LastModified,
                        size: object.Size
                    });
                }
            }

            return sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        } catch (error) {
            console.error('Error listing chat sessions:', error);
            return [];
        }
    }

    // Delete chat session from S3
    async deleteChatSession(sessionId) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: `${sessionId}.json`
            });

            await this.s3Client.send(command);
            console.log(`Chat session ${sessionId} deleted from S3`);
        } catch (error) {
            console.error('Error deleting chat session:', error);
            throw new Error('Failed to delete chat session from S3');
        }
    }

    // Delete all chat sessions
    async deleteAllChatSessions() {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            const sessions = await this.listChatSessions();
            
            for (const session of sessions) {
                await this.deleteChatSession(session.sessionId);
            }
            
            console.log('All chat sessions deleted');
        } catch (error) {
            console.error('Error deleting all chat sessions:', error);
            throw new Error('Failed to delete all chat sessions');
        }
    }

    // Check if services are initialized
    isInitialized() {
        return this.initialized;
    }

    // Get current model information
    getModelInfo() {
        return {
            modelId: this.modelId,
            modelName: 'Claude Sonnet 3.7',
            provider: 'Anthropic',
            region: this.region
        };
    }
}

// Create and export a singleton instance
const awsConfig = new AWSConfig();
export default awsConfig;
