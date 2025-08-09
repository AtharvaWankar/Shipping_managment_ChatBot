// AWS Configuration and Service Initialization using AWS SDK v3
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class AWSConfig {
    constructor() {
        this.accessKeyId = 'AKIARHJJMTTSEY2U6XQF';
        this.secretAccessKey = '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';
        this.region = 'us-east-1';
        this.bedrockAgentClient = null;
        this.s3Client = null;
        this.bucketName = 'chat-history-1512';
        // Try inference profile first, fallback to direct model ID
        this.modelArn = 'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0';
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

            // Initialize Bedrock Agent Runtime client (for knowledge base queries)
            this.bedrockAgentClient = new BedrockAgentRuntimeClient({
                region: this.region,
                credentials: credentials,
            });

            // Initialize S3 client with CORS configuration
            this.s3Client = new S3Client({
                region: this.region,
                credentials: credentials,
                forcePathStyle: true,
                useAccelerateEndpoint: false,
                requestHandler: {
                    requestTimeout: 10000,
                    httpsAgent: false
                }
            });

            // Using existing bucket chat-history-1512
            
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

    // Check if the chat history bucket exists and is accessible
    async ensureBucketExists() {
        try {
            // Test if we can access the bucket by attempting to list objects
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                MaxKeys: 1
            });
            const response = await this.s3Client.send(command);
            console.log(`S3 bucket ${this.bucketName} is accessible`);
            return true;
        } catch (error) {
            if (error.name === 'NetworkingError' || error.message.includes('Failed to fetch')) {
                console.error('CORS error accessing S3 bucket. Browser cannot directly access S3 due to CORS restrictions.');
                console.warn('Chat history will be saved to localStorage only.');
            } else {
                console.error('S3 bucket access failed:', error.message);
            }
            return false;
        }
    }

    // Query knowledge base via AWS Bedrock Agent Runtime (like your Python code)
    async invokeClaude(prompt, maxTokens = 4000) {
        if (!this.initialized) {
            throw new Error('AWS services not initialized. Call initialize() first.');
        }

        try {
            console.log('Querying knowledge base with prompt:', prompt);
            
            // Try correct inference profile formats for Claude 3.7 Sonnet
            const modelOptions = [
                'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0',
                'anthropic.claude-3-7-sonnet-20250219-v1:0'
            ];

            let lastError = null;
            
            for (const modelArn of modelOptions) {
                try {
                    const command = new RetrieveAndGenerateCommand({
                        input: {
                            text: prompt
                        },
                        retrieveAndGenerateConfiguration: {
                            type: 'KNOWLEDGE_BASE',
                            knowledgeBaseConfiguration: {
                                knowledgeBaseId: this.knowledgeBaseId,
                                modelArn: modelArn
                            }
                        }
                    });

                    const response = await this.bedrockAgentClient.send(command);
                    
                    if (response.output && response.output.text) {
                        console.log(`Success with model: ${modelArn}`);
                        return this.formatResponse(response.output.text);
                    } else {
                        throw new Error('No response text received from knowledge base');
                    }
                } catch (error) {
                    console.log(`Model ${modelArn} failed:`, error.message);
                    lastError = error;
                    continue; // Try next model
                }
            }
            
            // If all models failed, throw the last error
            throw lastError;
            
        } catch (error) {
            console.error('Error querying knowledge base:', error);
            throw new Error(`Failed to get response from Claude: ${error.message}. Please check your AWS credentials and model access.`);
        }
    }

    // Format response text like in your Python code
    formatResponse(text) {
        const formattedText = text.trim();
        const paragraphs = formattedText.split('\n\n');
        const cleanParagraphs = paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 0);
        return cleanParagraphs.join('\n\n');
    }

    // Save chat session to S3 (with CORS fallback)
    async saveChatSession(sessionId, messages) {
        const sessionData = {
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            messages: messages
        };

        // Always save to localStorage first as backup
        try {
            localStorage.setItem(`chat_${sessionId}`, JSON.stringify(sessionData));
            console.log(`✅ Chat session ${sessionId} saved to localStorage`);
        } catch (localError) {
            console.error('❌ Error saving chat session locally:', localError);
        }

        // Try S3 only if initialized
        if (!this.initialized) {
            console.warn('⚠️  AWS not initialized, using localStorage only');
            return { success: false, reason: 'AWS not initialized' };
        }

        try {
            // Create organized folder structure by date
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: `${year}/${month}/${day}/${sessionId}.json`,
                Body: JSON.stringify(sessionData, null, 2),
                ContentType: 'application/json',
                Metadata: {
                    'session-id': sessionId,
                    'chat-app': 'professional-chatbot'
                }
            });

            await this.s3Client.send(command);
            console.log(`✅ Chat session ${sessionId} saved to S3 successfully!`);
            return { success: true, location: 'S3 and localStorage' };
            
        } catch (error) {
            if (error.name === 'NetworkingError' || error.message.includes('Failed to fetch')) {
                console.warn('🚫 CORS Error: Cannot access S3 directly from browser');
                console.warn('💡 To fix: Add CORS configuration to your S3 bucket');
                console.warn('📍 Chat history saved to localStorage only');
                return { success: false, reason: 'CORS restriction' };
            } else {
                console.error('❌ S3 save failed:', error.message);
                return { success: false, reason: error.message };
            }
        }
    }

    // Load chat session from S3 or localStorage
    async loadChatSession(sessionId) {
        try {
            if (this.initialized && this.s3Client) {
                // Try to find the session by searching through date folders
                try {
                    const listCommand = new ListObjectsV2Command({
                        Bucket: this.bucketName,
                        Prefix: '',
                        Delimiter: '/'
                    });
                    
                    // Search for the session file
                    const allObjects = await this.s3Client.send(new ListObjectsV2Command({
                        Bucket: this.bucketName
                    }));
                    
                    const sessionFile = allObjects.Contents?.find(obj => 
                        obj.Key?.includes(`${sessionId}.json`)
                    );
                    
                    if (sessionFile) {
                        const command = new GetObjectCommand({
                            Bucket: this.bucketName,
                            Key: sessionFile.Key
                        });
                        const response = await this.s3Client.send(command);
                        const body = await response.Body.transformToString();
                        return JSON.parse(body);
                    }
                } catch (searchError) {
                    console.log('S3 search failed:', searchError.message);
                }
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
                        if (object.Key?.endsWith('.json')) {
                            // Extract session ID from path like "2025/08/09/chat_20250809_213122.json"
                            const sessionId = object.Key.split('/').pop()?.replace('.json', '');
                            if (sessionId) {
                                sessions.push({
                                    sessionId: sessionId,
                                    lastModified: object.LastModified,
                                    size: object.Size,
                                    source: 'S3'
                                });
                            }
                        }
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
                // Find and delete the session file
                const allObjects = await this.s3Client.send(new ListObjectsV2Command({
                    Bucket: this.bucketName
                }));
                
                const sessionFile = allObjects.Contents?.find(obj => 
                    obj.Key?.includes(`${sessionId}.json`)
                );
                
                if (sessionFile) {
                    const command = new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: sessionFile.Key
                    });
                    await this.s3Client.send(command);
                    console.log(`Chat session ${sessionId} deleted from S3`);
                }
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