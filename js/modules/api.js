/**
 * Kie AI API 客户端模块
 * 处理与 Nano Banana Pro API 的交互
 */

export class KieAIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.kie.ai/api/v1/jobs';
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * 创建图片生成任务
     * @param {string} prompt - 提示词
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} 任务创建结果
     */
    async createTask(prompt, options = {}) {
        const payload = {
            model: 'nano-banana-pro',
            input: {
                prompt: prompt,
                image_input: [],
                aspect_ratio: options.aspectRatio || '3:4', // 竖版A4比例
                resolution: options.resolution || '2K',
                output_format: options.format || 'png'
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}/createTask`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.code !== 200) {
                throw new Error(this.getErrorMessage(data.code, data.msg));
            }

            return data;
        } catch (error) {
            console.error('创建任务失败:', error);
            throw error;
        }
    }

    /**
     * 查询任务状态
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>} 任务状态
     */
    async queryTask(taskId) {
        try {
            const response = await fetch(`${this.baseUrl}/recordInfo?taskId=${taskId}`, {
                method: 'GET',
                headers: this.headers
            });

            const data = await response.json();

            if (data.code !== 200) {
                throw new Error(this.getErrorMessage(data.code, data.msg));
            }

            return data;
        } catch (error) {
            console.error('查询任务失败:', error);
            throw error;
        }
    }

    /**
     * 轮询任务直到完成
     * @param {string} taskId - 任务ID
     * @param {number} maxAttempts - 最大尝试次数
     * @param {number} interval - 轮询间隔（毫秒）
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>} 任务结果
     */
    async pollUntilComplete(taskId, maxAttempts = 30, interval = 2000, onProgress = null) {
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const result = await this.queryTask(taskId);
                const state = result.data.state;

                // 调用进度回调
                if (onProgress) {
                    onProgress({
                        state: state,
                        attempts: attempts + 1,
                        maxAttempts: maxAttempts
                    });
                }

                if (state === 'success') {
                    return result;
                } else if (state === 'fail') {
                    throw new Error(result.data.failMsg || '任务执行失败');
                }

                // 等待后继续轮询
                await new Promise(resolve => setTimeout(resolve, interval));
                attempts++;
            } catch (error) {
                // 如果是最后一次尝试，抛出错误
                if (attempts === maxAttempts - 1) {
                    throw error;
                }
                attempts++;
            }
        }

        throw new Error('任务超时，请稍后重试');
    }

    /**
     * 更新API Key
     * @param {string} newApiKey - 新的API Key
     */
    updateApiKey(newApiKey) {
        this.apiKey = newApiKey;
        this.headers.Authorization = `Bearer ${newApiKey}`;
    }

    /**
     * 获取错误消息
     * @param {number} code - 错误码
     * @param {string} message - 原始错误消息
     * @returns {string} 用户友好的错误消息
     */
    getErrorMessage(code, message) {
        const errorMap = {
            400: '请求参数错误',
            401: 'API Key无效，请检查配置',
            402: '账户余额不足',
            404: '资源未找到',
            422: '参数验证失败',
            429: '请求过于频繁，请稍后重试',
            500: '服务器错误，请稍后重试'
        };

        return errorMap[code] || message || '未知错误';
    }
}

/**
 * API 管理器
 * 统一管理API客户端和相关配置
 */
export class APIManager {
    constructor() {
        this.client = null;
        this.settings = {
            resolution: '2K',
            format: 'png',
            aspectRatio: '3:4'
        };
        this.init();
    }

    /**
     * 初始化API管理器
     */
    init() {
        const apiKey = this.getApiKey();
        if (apiKey) {
            this.client = new KieAIClient(apiKey);
            console.log('API管理器初始化成功，已加载API Key');
        } else {
            console.log('API管理器初始化完成，但未配置API Key');
        }
    }

    /**
     * 从本地存储获取API Key
     * @returns {string|null} API Key
     */
    getApiKey() {
        try {
            const encoded = localStorage.getItem('kie_ai_api_key');
            return encoded ? atob(encoded) : null;
        } catch (error) {
            console.error('获取API Key失败:', error);
            return null;
        }
    }

    /**
     * 保存API Key到本地存储
     * @param {string} apiKey - API Key
     */
    saveApiKey(apiKey) {
        try {
            const encoded = btoa(apiKey);
            localStorage.setItem('kie_ai_api_key', encoded);
            this.client = new KieAIClient(apiKey);
            return true;
        } catch (error) {
            console.error('保存API Key失败:', error);
            return false;
        }
    }

    /**
     * 清除API Key
     */
    clearApiKey() {
        localStorage.removeItem('kie_ai_api_key');
        this.client = null;
    }

    /**
     * 检查是否已配置API Key
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.getApiKey();
    }

    /**
     * 生成图片
     * @param {string} prompt - 提示词
     * @param {Object} options - 生成选项
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<string>} 图片URL
     */
    async generateImage(prompt, options = {}, onProgress = null) {
        // 检查API Key是否配置
        if (!this.isConfigured()) {
            throw new Error('API Key未配置，请先设置API Key');
        }

        // 如果client未初始化，尝试初始化
        if (!this.client) {
            const apiKey = this.getApiKey();
            if (apiKey) {
                this.client = new KieAIClient(apiKey);
            } else {
                throw new Error('API Key未配置，请先设置API Key');
            }
        }

        const mergedOptions = {
            ...this.settings,
            ...options
        };

        // 创建任务
        const createResult = await this.client.createTask(prompt, mergedOptions);
        const taskId = createResult.data.taskId;

        // 轮询直到完成
        const result = await this.client.pollUntilComplete(
            taskId,
            30,
            2000,
            onProgress
        );

        // 解析结果
        const resultJson = JSON.parse(result.data.resultJson);
        const imageUrl = resultJson.resultUrls[0];

        if (!imageUrl) {
            throw new Error('图片生成失败，未获取到图片URL');
        }

        return imageUrl;
    }

    /**
     * 更新设置
     * @param {Object} newSettings - 新设置
     */
    updateSettings(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
    }

    /**
     * 获取当前设置
     * @returns {Object} 当前设置
     */
    getSettings() {
        return { ...this.settings };
    }
}

// 创建全局API管理器实例
export const apiManager = new APIManager();