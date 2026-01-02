/**
 * 对话框组件
 * 处理对话界面的展示和交互
 */

export class DialogComponent {
    constructor(container) {
        this.container = container;
        this.dialogBox = container.querySelector('#dialogBox');
        this.messages = [];
    }

    /**
     * 添加消息到对话框
     * @param {Object} message - 消息对象
     */
    addMessage(message) {
        const messageElement = this.createMessageElement(message);
        this.dialogBox.appendChild(messageElement);
        this.messages.push(message);

        // 滚动到底部
        this.scrollToBottom();

        // 如果是AI消息且包含提示词，格式化显示
        if (message.type === 'ai' && message.prompt) {
            this.formatPromptMessage(messageElement, message.prompt);
        }
    }

    /**
     * 创建消息元素
     * @param {Object} message - 消息对象
     * @returns {HTMLElement} 消息元素
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // 处理消息内容
        if (message.content) {
            // 支持简单的换行
            const lines = message.content.split('\n');
            lines.forEach((line, index) => {
                if (index > 0) {
                    messageContent.appendChild(document.createElement('br'));
                }
                const textNode = document.createTextNode(line);
                messageContent.appendChild(textNode);
            });
        }

        messageDiv.appendChild(messageContent);

        return messageDiv;
    }

    /**
     * 格式化提示词消息
     * @param {HTMLElement} messageElement - 消息元素
     * @param {string} prompt - 提示词内容
     */
    formatPromptMessage(messageElement, prompt) {
        const messageContent = messageElement.querySelector('.message-content');

        // 创建提示词容器
        const promptContainer = document.createElement('div');
        promptContainer.className = 'prompt-container';

        // 添加提示词标题
        const promptTitle = document.createElement('p');
        promptTitle.textContent = '已生成AI绘图提示词：';
        promptTitle.style.fontWeight = 'bold';
        promptTitle.style.marginBottom = '0.5rem';
        promptContainer.appendChild(promptTitle);

        // 创建代码块
        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.textContent = prompt;

        // 使代码块可折叠
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-prompt';
        toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i> 展开提示词';
        toggleButton.style.marginTop = '0.5rem';
        toggleButton.style.padding = '0.25rem 0.5rem';
        toggleButton.style.fontSize = '0.9rem';
        toggleButton.style.cursor = 'pointer';

        let isExpanded = false;
        toggleButton.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                codeBlock.style.display = 'block';
                toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i> 收起提示词';
            } else {
                codeBlock.style.display = 'none';
                toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i> 展开提示词';
            }
        });

        // 初始状态：折叠提示词
        codeBlock.style.display = 'none';

        promptContainer.appendChild(toggleButton);
        promptContainer.appendChild(codeBlock);
        messageContent.appendChild(promptContainer);
    }

    /**
     * 清空对话框
     */
    clear() {
        this.dialogBox.innerHTML = '';
        this.messages = [];
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        this.dialogBox.scrollTop = this.dialogBox.scrollHeight;
    }

    /**
     * 显示加载消息
     * @param {string} message - 加载消息
     * @returns {Function} 移除加载消息的函数
     */
    showLoadingMessage(message = '正在处理，请稍候...') {
        const loadingMessage = {
            type: 'system',
            content: message,
            isLoading: true
        };

        const messageElement = this.createMessageElement(loadingMessage);

        // 添加加载动画
        const messageContent = messageElement.querySelector('.message-content');
        const loadingDots = document.createElement('span');
        loadingDots.className = 'loading-dots';
        loadingDots.innerHTML = '<span>.</span><span>.</span><span>.</span>';

        // 添加加载动画样式
        const style = document.createElement('style');
        style.textContent = `
            .loading-dots span {
                animation: blink 1.4s infinite both;
                display: inline-block;
                width: 10px;
                text-align: left;
            }
            .loading-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }
            .loading-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            @keyframes blink {
                0%, 60%, 100% {
                    opacity: 0.2;
                }
                30% {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        messageContent.appendChild(loadingDots);
        this.dialogBox.appendChild(messageElement);
        this.scrollToBottom();

        // 返回移除函数
        return () => {
            messageElement.remove();
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }

    /**
     * 更新消息
     * @param {string} messageId - 消息ID
     * @param {Object} newData - 新数据
     */
    updateMessage(messageId, newData) {
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            // 更新消息数据
            this.messages[messageIndex] = { ...this.messages[messageIndex], ...newData };

            // 重新渲染该消息
            const messageElements = this.dialogBox.querySelectorAll('.message');
            if (messageElements[messageIndex]) {
                const newMessageElement = this.createMessageElement(this.messages[messageIndex]);
                messageElements[messageIndex].replaceWith(newMessageElement);
            }
        }
    }

    /**
     * 获取所有消息
     * @returns {Array} 消息列表
     */
    getMessages() {
        return [...this.messages];
    }

    /**
     * 设置消息列表
     * @param {Array} messages - 消息列表
     */
    setMessages(messages) {
        this.clear();
        messages.forEach(message => this.addMessage(message));
    }
}

/**
 * 输入区域组件
 * 处理用户输入和发送
 */
export class InputComponent {
    constructor(container) {
        this.container = container;
        this.inputArea = container.querySelector('#inputArea');
        this.userInput = container.querySelector('#userInput');
        this.sendBtn = container.querySelector('#sendBtn');
        this.isProcessing = false;

        this.init();
    }

    /**
     * 初始化组件
     */
    init() {
        // 发送按钮点击事件
        this.sendBtn.addEventListener('click', () => this.handleSend());

        // 输入框事件
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    /**
     * 设置回调函数
     * @param {Function} callback - 输入回调
     */
    setCallback(callback) {
        this.callback = callback;
    }

    /**
     * 处理发送
     */
    async handleSend() {
        if (this.isProcessing) return;

        const input = this.userInput.value.trim();
        if (!input) return;

        this.isProcessing = true;
        this.setProcessingState(true);

        try {
            if (this.callback) {
                await this.callback(input);
            }

            // 清空输入框
            this.userInput.value = '';
            this.userInput.focus();
        } catch (error) {
            console.error('处理输入失败:', error);
            this.showError('处理失败，请重试');
        } finally {
            this.isProcessing = false;
            this.setProcessingState(false);
        }
    }

    /**
     * 设置处理状态
     * @param {boolean} isProcessing - 是否正在处理
     */
    setProcessingState(isProcessing) {
        this.sendBtn.disabled = isProcessing;
        this.userInput.disabled = isProcessing;

        if (isProcessing) {
            this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
        } else {
            this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送';
        }
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        // 简单的alert，实际项目中可以使用更好的UI组件
        alert(message);
    }

    /**
     * 显示输入区域
     */
    show() {
        this.inputArea.style.display = 'flex';
        this.userInput.focus();
    }

    /**
     * 隐藏输入区域
     */
    hide() {
        this.inputArea.style.display = 'none';
    }

    /**
     * 设置输入框占位符
     * @param {string} placeholder - 占位符文本
     */
    setPlaceholder(placeholder) {
        this.userInput.placeholder = placeholder;
    }

    /**
     * 获取输入值
     * @returns {string} 输入值
     */
    getValue() {
        return this.userInput.value.trim();
    }

    /**
     * 设置输入值
     * @param {string} value - 输入值
     */
    setValue(value) {
        this.userInput.value = value;
    }

    /**
     * 聚焦输入框
     */
    focus() {
        this.userInput.focus();
    }
}