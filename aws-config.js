// AWS Configuration and Service Initialization using AWS SDK v3
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, CreateBucketCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class AWSConfig {
    constructor() {
        this.accessKeyId = 'AKIARHJJMTTSEY2U6XQF';
        this.secretAccessKey = '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';
        this.region = 'us-east-1';
        this.bedrockClient = null;
        this.s3Client = null;
        this.bucketName = 'chat-history';
        this.modelId = 'anthropic.claude-3-7-sonnet-20250219-v1:0';
        this.knowledgeBaseId = 'P33K9CRFWL';
        this.initialized = false;
        
        // Auto-initialize on construction
        this.initialize();
    }

    // Initialize AWS clients with credentials
    async initialize() {
        try {
            const credentials = {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            };

            // Initialize Bedrock Runtime client
            this.bedrockClient = new BedrockRuntimeClient({
                region: this.region,
                credentials: credentials,
            });

            // Initialize S3 client
            this.s3Client = new S3Client({
                region: this.region,
                credentials: credentials,
            });

            // Create chat history bucket if it doesn't exist
            await this.ensureBucketExists();
            
            this.initialized = true;
            console.log('AWS services initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AWS services:', error);
            // Set as initialized anyway to allow UI testing
            this.initialized = true;
            return false;
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
            }
        }
    }

    // Invoke Claude model via AWS Bedrock
    async invokeClaude(prompt, maxTokens = 4000) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            console.log('Invoking Claude with prompt:', prompt);
            
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            };

            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });

            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
                return responseBody.content[0].text;
            } else {
                throw new Error('Unexpected response format from Claude model');
            }
        } catch (error) {
            console.error('Error invoking Claude model:', error);
            throw new Error(`Failed to get response from Claude: ${error.message}. Please check your AWS credentials and model access.`);
        }
    }

    // Save chat session to S3
    async saveChatSession(sessionId, messages) {
        if (!this.initialized) {
            // Fallback to localStorage if S3 not available
            try {
                const sessionData = {
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    messages: messages
                };
                localStorage.setItem(`chat_${sessionId}`, JSON.stringify(sessionData));
                console.log(`Chat session ${sessionId} saved locally`);
            } catch (error) {
                console.error('Error saving chat session locally:', error);
            }
            return;
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
            console.error('Error saving chat session to S3:', error);
            // Fallback to localStorage
            try {
                const sessionData = {
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    messages: messages
                };
                localStorage.setItem(`chat_${sessionId}`, JSON.stringify(sessionData));
                console.log(`Chat session ${sessionId} saved locally as fallback`);
            } catch (localError) {
                console.error('Error saving chat session locally:', localError);
            }
        }
    }

    // Load chat session from S3 or localStorage
    async loadChatSession(sessionId) {
        try {
            if (this.initialized && this.s3Client) {
                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: `${sessionId}.json`
                });
                const response = await this.s3Client.send(command);
                const body = await response.Body.transformToString();
                return JSON.parse(body);
            }
        } catch (error) {
            console.log('S3 load failed, trying localStorage:', error.message);
        }

        // Fallback to localStorage
        try {
            const sessionData = localStorage.getItem(`chat_${sessionId}`);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Error loading chat session:', error);
            return null;
        }
    }

    // List all chat sessions
    async listChatSessions() {
        let sessions = [];

        // Try S3 first
        if (this.initialized && this.s3Client) {
            try {
                const command = new ListObjectsV2Command({
                    Bucket: this.bucketName
                });
                const response = await this.s3Client.send(command);
                
                if (response.Contents) {
                    for (const object of response.Contents) {
                        const sessionId = object.Key.replace('.json', '');
                        sessions.push({
                            sessionId: sessionId,
                            lastModified: object.LastModified,
                            size: object.Size,
                            source: 'S3'
                        });
                    }
                }
            } catch (error) {
                console.log('S3 list failed, using localStorage:', error.message);
            }
        }

        // Add localStorage sessions
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    const sessionId = key.replace('chat_', '');
                    // Avoid duplicates from S3
                    if (!sessions.find(s => s.sessionId === sessionId)) {
                        const sessionData = JSON.parse(localStorage.getItem(key));
                        sessions.push({
                            sessionId: sessionId,
                            lastModified: new Date(sessionData.timestamp),
                            size: JSON.stringify(sessionData).length,
                            source: 'Local'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error listing local sessions:', error);
        }

        return sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }

    // Delete chat session
    async deleteChatSession(sessionId) {
        try {
            if (this.initialized && this.s3Client) {
                const command = new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: `${sessionId}.json`
                });
                await this.s3Client.send(command);
                console.log(`Chat session ${sessionId} deleted from S3`);
            }
        } catch (error) {
            console.log('S3 delete failed:', error.message);
        }

        // Also delete from localStorage
        try {
            localStorage.removeItem(`chat_${sessionId}`);
            console.log(`Chat session ${sessionId} deleted locally`);
        } catch (error) {
            console.error('Error deleting local session:', error);
        }
    }

    // Delete all chat sessions
    async deleteAllChatSessions() {
        try {
            const sessions = await this.listChatSessions();
            
            for (const session of sessions) {
                await this.deleteChatSession(session.sessionId);
            }
            
            console.log('All chat sessions deleted');
        } catch (error) {
            console.error('Error deleting all chat sessions:', error);
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
            modelName: 'Claude 3.7 Sonnet',
            provider: 'Anthropic',
            region: this.region,
            knowledgeBaseId: this.knowledgeBaseId
        };
    }
}

// Create and expose singleton instance globally
const awsConfig = new AWSConfig();
window.awsConfig = awsConfig;

export default awsConfig;