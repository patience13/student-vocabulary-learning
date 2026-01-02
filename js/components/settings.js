/**
 * API设置组件
 * 处理API Key配置和生成参数设置
 */

export class SettingsComponent {
    constructor(container) {
        this.container = container;
        this.settingsBtn = container.querySelector('#settingsBtn');
        this.settingsModal = container.querySelector('#settingsModal');
        this.modalContent = this.settingsModal.querySelector('.modal-content');

        // 表单元素
        this.apiKeyInput = container.querySelector('#apiKeyInput');
        this.resolutionSelect = container.querySelector('#resolutionSelect');
        this.formatSelect = container.querySelector('#formatSelect');

        // 按钮
        this.saveSettingsBtn = container.querySelector('#saveSettingsBtn');
        this.cancelSettingsBtn = container.querySelector('#cancelSettingsBtn');
        this.modalCloseBtn = this.settingsModal.querySelector('.modal-close');

        // 回调函数
        this.callbacks = {};

        this.init();
    }

    /**
     * 初始化组件
     */
    init() {
        // 设置按钮点击事件
        this.settingsBtn.addEventListener('click', () => {
            this.show();
        });

        // 保存设置按钮
        this.saveSettingsBtn.addEventListener('click', () => {
            this.handleSaveSettings();
        });

        // 取消按钮
        this.cancelSettingsBtn.addEventListener('click', () => {
            this.hide();
        });

        // 关闭按钮
        this.modalCloseBtn.addEventListener('click', () => {
            this.hide();
        });

        // 点击模态框外部关闭
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hide();
            }
        });

        // API Key输入验证
        this.apiKeyInput.addEventListener('input', () => {
            this.validateApiKey();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal.style.display === 'block') {
                this.hide();
            }
        });
    }

    /**
     * 设置回调函数
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    /**
     * 显示设置模态框
     */
    show() {
        this.settingsModal.style.display = 'flex';

        // 加载当前设置
        this.loadCurrentSettings();

        // 聚焦API Key输入框
        setTimeout(() => {
            this.apiKeyInput.focus();
        }, 100);
    }

    /**
     * 隐藏设置模态框
     */
    hide() {
        this.settingsModal.style.display = 'none';
        this.clearValidation();
    }

    /**
     * 加载当前设置
     */
    loadCurrentSettings() {
        // 加载API Key
        const apiKey = this.getStoredApiKey();
        if (apiKey) {
            // 显示脱敏的API Key
            this.apiKeyInput.value = this.maskApiKey(apiKey);
            this.apiKeyInput.dataset.fullKey = apiKey;
        } else {
            this.apiKeyInput.value = '';
            delete this.apiKeyInput.dataset.fullKey;
        }

        // 加载其他设置（如果有本地存储）
        const settings = this.getStoredSettings();
        if (settings) {
            this.resolutionSelect.value = settings.resolution || '2K';
            this.formatSelect.value = settings.format || 'png';
        }
    }

    /**
     * 获取存储的API Key
     * @returns {string|null} API Key
     */
    getStoredApiKey() {
        try {
            const encoded = localStorage.getItem('kie_ai_api_key');
            return encoded ? atob(encoded) : null;
        } catch (error) {
            console.error('获取API Key失败:', error);
            return null;
        }
    }

    /**
     * 获取存储的设置
     * @returns {Object} 设置对象
     */
    getStoredSettings() {
        try {
            const settings = localStorage.getItem('app_settings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('获取设置失败:', error);
            return null;
        }
    }

    /**
     * 处理保存设置
     */
    async handleSaveSettings() {
        if (!this.validateSettings()) {
            return;
        }

        // 获取表单数据
        const formData = this.getFormData();

        try {
            // 保存设置
            await this.saveSettings(formData);

            // 调用保存回调
            if (this.callbacks.onSave) {
                await this.callbacks.onSave(formData);
            }

            // 显示成功消息
            this.showSuccessMessage('设置保存成功！');

            // 延迟关闭
            setTimeout(() => {
                this.hide();
            }, 1000);

        } catch (error) {
            console.error('保存设置失败:', error);
            this.showErrorMessage('保存失败：' + error.message);
        }
    }

    /**
     * 验证设置
     * @returns {boolean} 验证结果
     */
    validateSettings() {
        let isValid = true;

        // 验证API Key
        if (!this.validateApiKey()) {
            isValid = false;
        }

        // 验证其他字段
        if (!this.resolutionSelect.value) {
            this.showFieldError(this.resolutionSelect, '请选择分辨率');
            isValid = false;
        }

        if (!this.formatSelect.value) {
            this.showFieldError(this.formatSelect, '请选择输出格式');
            isValid = false;
        }

        return isValid;
    }

    /**
     * 验证API Key
     * @returns {boolean} 验证结果
     */
    validateApiKey() {
        const apiKey = this.apiKeyInput.dataset.fullKey || this.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showFieldError(this.apiKeyInput, '请输入API Key');
            return false;
        }

        if (apiKey.length < 32) {
            this.showFieldError(this.apiKeyInput, 'API Key长度不正确');
            return false;
        }

        this.clearFieldError(this.apiKeyInput);
        return true;
    }

    /**
     * 获取表单数据
     * @returns {Object} 表单数据
     */
    getFormData() {
        // 获取完整的API Key（可能是脱敏的）
        const apiKey = this.apiKeyInput.dataset.fullKey || this.apiKeyInput.value.trim();

        return {
            apiKey: apiKey,
            resolution: this.resolutionSelect.value,
            format: this.formatSelect.value
        };
    }

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     */
    async saveSettings(settings) {
        // 保存API Key
        if (settings.apiKey) {
            try {
                const encoded = btoa(settings.apiKey);
                localStorage.setItem('kie_ai_api_key', encoded);
            } catch (error) {
                throw new Error('保存API Key失败');
            }
        }

        // 保存其他设置
        const otherSettings = {
            resolution: settings.resolution,
            format: settings.format
        };

        try {
            localStorage.setItem('app_settings', JSON.stringify(otherSettings));
        } catch (error) {
            throw new Error('保存设置失败');
        }
    }

    /**
     * 脱敏API Key
     * @param {string} apiKey - 原始API Key
     * @returns {string} 脱敏后的API Key
     */
    maskApiKey(apiKey) {
        if (!apiKey || apiKey.length < 8) {
            return apiKey;
        }

        const start = apiKey.substring(0, 4);
        const end = apiKey.substring(apiKey.length - 4);
        const middle = '*'.repeat(apiKey.length - 8);

        return start + middle + end;
    }

    /**
     * 显示字段错误
     * @param {HTMLElement} field - 字段元素
     * @param {string} message - 错误消息
     */
    showFieldError(field, message) {
        field.classList.add('error');

        // 查找或创建错误消息元素
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * 清除字段错误
     * @param {HTMLElement} field - 字段元素
     */
    clearFieldError(field) {
        field.classList.remove('error');

        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * 清除所有验证错误
     */
    clearValidation() {
        const fields = [this.apiKeyInput, this.resolutionSelect, this.formatSelect];
        fields.forEach(field => this.clearFieldError(field));
    }

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showMessage(message, type) {
        // 查找或创建消息容器
        let messageContainer = this.modalContent.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            this.modalContent.insertBefore(messageContainer, this.modalContent.firstChild);
        }

        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        // 添加样式
        messageElement.style.cssText = `
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            ${type === 'success' ?
                'background-color: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9;' :
                'background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2;'
            }
        `;

        // 清空并添加新消息
        messageContainer.innerHTML = '';
        messageContainer.appendChild(messageElement);

        // 自动隐藏
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (messageContainer.contains(messageElement)) {
                    messageContainer.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 检查是否已配置API Key
     * @returns {boolean} 是否已配置
     */
    isConfigured() {
        return !!this.getStoredApiKey();
    }

    /**
     * 获取当前设置
     * @returns {Object} 当前设置
     */
    getCurrentSettings() {
        return {
            apiKey: this.getStoredApiKey(),
            resolution: this.resolutionSelect.value,
            format: this.formatSelect.value,
            isConfigured: this.isConfigured()
        };
    }

    /**
     * 重置设置
     */
    reset() {
        localStorage.removeItem('kie_ai_api_key');
        localStorage.removeItem('app_settings');
        this.apiKeyInput.value = '';
        delete this.apiKeyInput.dataset.fullKey;
        this.resolutionSelect.value = '2K';
        this.formatSelect.value = 'png';
    }
}