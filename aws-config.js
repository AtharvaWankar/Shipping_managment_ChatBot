// AWS Configuration and Service Initialization
class AWSConfig {
    constructor() {
        this.accessKeyId = 'AKIARHJJMTTSEY2U6XQF';
        this.secretAccessKey = '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';
        this.region = 'us-east-1';
        this.bucketName = 'chat-history';
        this.modelId = 'anthropic.claude-3-7-sonnet-20250219-v1:0';
        this.knowledgeBaseId = 'P33K9CRFWL';
        this.initialized = false;
        
        // Auto-initialize on construction
        this.initialize().catch(console.error);
    }

    // Initialize AWS clients with credentials
    async initialize() {
        try {
            // Configure AWS SDK v2
            AWS.config.update({
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                region: this.region
            });

            // Create chat history bucket if it doesn't exist
            await this.ensureBucketExists();
            
            this.initialized = true;
            console.log('AWS services initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AWS services:', error);
            // For now, let's continue even if AWS fails to allow UI testing
            this.initialized = true;
            return false;
        }
    }

    // Ensure the chat history bucket exists
    async ensureBucketExists() {
        try {
            const s3 = new AWS.S3();
            await s3.createBucket({ Bucket: this.bucketName }).promise();
            console.log(`Bucket ${this.bucketName} created successfully`);
        } catch (error) {
            // Bucket might already exist - this is fine
            if (error.code !== 'BucketAlreadyOwnedByYou' && error.code !== 'BucketAlreadyExists') {
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
            
            // Create Bedrock Runtime client
            const bedrockRuntime = new AWS.BedrockRuntime({
                region: this.region,
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey
            });

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

            const params = {
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            };

            const response = await bedrockRuntime.invokeModel(params).promise();
            const responseBody = JSON.parse(response.body.toString());
            
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
            return; // Skip if not initialized
        }

        try {
            const sessionData = {
                sessionId: sessionId,
                timestamp: new Date().toISOString(),
                messages: messages
            };

            // For demo, save to localStorage instead of S3
            localStorage.setItem(`chat_${sessionId}`, JSON.stringify(sessionData));
            console.log(`Chat session ${sessionId} saved locally`);
        } catch (error) {
            console.error('Error saving chat session:', error);
        }
    }

    // Load chat session from localStorage
    async loadChatSession(sessionId) {
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
        try {
            const sessions = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    const sessionId = key.replace('chat_', '');
                    const sessionData = JSON.parse(localStorage.getItem(key));
                    sessions.push({
                        sessionId: sessionId,
                        lastModified: new Date(sessionData.timestamp),
                        size: JSON.stringify(sessionData).length
                    });
                }
            }
            return sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        } catch (error) {
            console.error('Error listing chat sessions:', error);
            return [];
        }
    }

    // Delete chat session
    async deleteChatSession(sessionId) {
        try {
            localStorage.removeItem(`chat_${sessionId}`);
            console.log(`Chat session ${sessionId} deleted`);
        } catch (error) {
            console.error('Error deleting chat session:', error);
        }
    }

    // Delete all chat sessions
    async deleteAllChatSessions() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
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
            modelName: 'Claude Sonnet 3.7',
            provider: 'Anthropic',
            region: this.region
        };
    }
}

// Create and expose a singleton instance globally
const awsConfig = new AWSConfig();
window.awsConfig = awsConfig;
