/**
 * 图片查看器组件
 * 处理图片生成进度展示和结果展示
 */

export class ImageViewerComponent {
    constructor(container) {
        this.container = container;
        this.previewSection = container.querySelector('#previewSection');
        this.imageViewer = container.querySelector('#imageViewer');
        this.generationProgress = container.querySelector('#generationProgress');
        this.imageResult = container.querySelector('#imageResult');
        this.generatedImage = container.querySelector('#generatedImage');

        // 按钮
        this.downloadBtn = container.querySelector('#downloadBtn');
        this.regenerateBtn = container.querySelector('#regenerateBtn');
        this.newCreateBtn = container.querySelector('#newCreateBtn');

        // 回调函数
        this.callbacks = {};

        this.init();
    }

    /**
     * 初始化组件
     */
    init() {
        // 下载按钮
        this.downloadBtn.addEventListener('click', () => {
            if (this.callbacks.onDownload) {
                this.callbacks.onDownload(this.generatedImage.src);
            }
        });

        // 重新生成按钮
        this.regenerateBtn.addEventListener('click', () => {
            if (this.callbacks.onRegenerate) {
                this.callbacks.onRegenerate();
            }
        });

        // 创建新小报按钮
        this.newCreateBtn.addEventListener('click', () => {
            if (this.callbacks.onNewCreate) {
                this.callbacks.onNewCreate();
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
     * 显示生成进度
     * @param {Object} progress - 进度信息
     */
    showProgress(progress) {
        this.previewSection.style.display = 'block';
        this.generationProgress.style.display = 'block';
        this.imageResult.style.display = 'none';

        const progressContent = this.generationProgress.querySelector('.progress-content');
        const progressText = progressContent.querySelector('p');
        const progressFill = this.generationProgress.querySelector('.progress-fill');

        // 更新进度文本
        if (progress.state === 'waiting') {
            progressText.textContent = '任务已提交，等待处理...';
        } else if (progress.state === 'processing') {
            progressText.textContent = `正在生成小报，请稍候... (${progress.attempts}/${progress.maxAttempts})`;
        }

        // 更新进度条
        const percentage = (progress.attempts / progress.maxAttempts) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    /**
     * 显示生成的图片
     * @param {string} imageUrl - 图片URL
     */
    showImage(imageUrl) {
        this.previewSection.style.display = 'block';
        this.generationProgress.style.display = 'none';
        this.imageResult.style.display = 'block';

        // 设置图片源
        this.generatedImage.src = imageUrl;
        this.generatedImage.alt = '生成的儿童识字小报';

        // 滚动到图片位置
        this.previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * 隐藏图片查看器
     */
    hide() {
        this.previewSection.style.display = 'none';
    }

    /**
     * 重置组件状态
     */
    reset() {
        this.hide();
        this.generatedImage.src = '';

        // 重置进度条
        const progressFill = this.generationProgress.querySelector('.progress-fill');
        progressFill.style.width = '0%';
    }

    /**
     * 显示错误状态
     * @param {string} errorMessage - 错误消息
     */
    showError(errorMessage) {
        this.previewSection.style.display = 'block';
        this.generationProgress.style.display = 'none';
        this.imageResult.style.display = 'none';

        // 创建错误提示
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--error-color); margin-bottom: 1rem;">生成失败</h3>
                <p style="margin-bottom: 1.5rem;">${errorMessage}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;

        // 插入错误提示
        this.imageViewer.appendChild(errorElement);

        // 滚动到错误位置
        this.previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * 获取当前图片URL
     * @returns {string} 图片URL
     */
    getImageUrl() {
        return this.generatedImage.src;
    }

    /**
     * 下载图片
     * @param {string} filename - 文件名
     */
    downloadImage(filename = '儿童识字小报.png') {
        const imageUrl = this.getImageUrl();
        if (!imageUrl) return;

        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 设置按钮状态
     * @param {Object} states - 按钮状态对象
     */
    setButtonStates(states) {
        if (states.download !== undefined) {
            this.downloadBtn.disabled = !states.download;
        }
        if (states.regenerate !== undefined) {
            this.regenerateBtn.disabled = !states.regenerate;
        }
        if (states.newCreate !== undefined) {
            this.newCreateBtn.disabled = !states.newCreate;
        }
    }
}

/**
 * 主题选择器组件
 * 处理预制主题的选择
 */
export class ThemeSelectorComponent {
    constructor(container) {
        this.container = container;
        this.themeSelector = container.querySelector('#themeSelector');
        this.themeCards = container.querySelectorAll('.theme-card');
        this.startConversationBtn = container.querySelector('#startConversationBtn');

        this.selectedTheme = null;
        this.selectedTitle = null;
        this.callbacks = {};

        this.init();
    }

    /**
     * 初始化组件
     */
    init() {
        // 主题卡片点击事件
        this.themeCards.forEach(card => {
            card.addEventListener('click', () => {
                this.handleThemeCardClick(card);
            });
        });

        // 开始按钮点击事件
        this.startConversationBtn.addEventListener('click', () => {
            this.handleStartConversation();
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
     * 处理主题卡片点击
     * @param {HTMLElement} card - 点击的卡片
     */
    handleThemeCardClick(card) {
        // 清除之前的选中状态
        this.themeCards.forEach(c => c.classList.remove('selected'));

        // 设置选中状态
        card.classList.add('selected');

        // 获取主题信息
        const theme = card.dataset.theme;

        if (theme === 'custom') {
            // 自定义主题
            this.handleCustomTheme();
        } else {
            // 预设主题
            this.handlePresetTheme(card);
        }
    }

    /**
     * 处理预设主题
     * @param {HTMLElement} card - 主题卡片
     */
    async handlePresetTheme(card) {
        const theme = card.dataset.theme;
        this.selectedTheme = theme;

        // 显示标题选择
        this.showTitleSelection(theme);

        // 启用开始按钮
        this.startConversationBtn.disabled = false;
    }

    /**
     * 处理自定义主题
     */
    handleCustomTheme() {
        this.selectedTheme = 'custom';
        this.selectedTitle = null;

        // 隐藏标题选择，直接显示开始按钮
        this.hideTitleSelection();

        // 启用开始按钮
        this.startConversationBtn.disabled = false;

        // 调用自定义主题回调
        if (this.callbacks.onCustomTheme) {
            this.callbacks.onCustomTheme();
        }
    }

    /**
     * 显示标题选择
     * @param {string} theme - 主题
     */
    showTitleSelection(theme) {
        // 查找或创建标题选择容器
        let titleContainer = this.themeSelector.querySelector('.title-selection');
        if (!titleContainer) {
            titleContainer = document.createElement('div');
            titleContainer.className = 'title-selection';
            this.themeSelector.insertBefore(titleContainer, this.startConversationBtn);
        }

        // 加载主题数据
        this.loadThemeTitles(theme).then(titles => {
            if (titles && titles.length > 0) {
                // 显示标题列表
                titleContainer.innerHTML = `
                    <h4>选择一个标题：</h4>
                    <div class="title-list">
                        ${titles.map((title, index) => `
                            <button class="title-btn ${index === 0 ? 'selected' : ''}" data-title="${title}">
                                ${title}
                            </button>
                        `).join('')}
                        <button class="title-btn custom-title" data-title="">
                            <i class="fas fa-plus"></i> 自定义标题
                        </button>
                    </div>
                `;

                // 默认选中第一个标题
                this.selectedTitle = titles[0];

                // 添加标题点击事件
                titleContainer.querySelectorAll('.title-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        titleContainer.querySelectorAll('.title-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');

                        const title = btn.dataset.title;
                        if (title === '') {
                            // 自定义标题
                            this.selectedTitle = null;
                            this.showCustomTitleInput();
                        } else {
                            this.selectedTitle = title;
                            this.hideCustomTitleInput();
                        }
                    });
                });
            }
        });
    }

    /**
     * 隐藏标题选择
     */
    hideTitleSelection() {
        const titleContainer = this.themeSelector.querySelector('.title-selection');
        if (titleContainer) {
            titleContainer.remove();
        }
        this.hideCustomTitleInput();
    }

    /**
     * 显示自定义标题输入
     */
    showCustomTitleInput() {
        // 查找或创建自定义标题输入
        let customInputContainer = this.themeSelector.querySelector('.custom-title-input');
        if (!customInputContainer) {
            customInputContainer = document.createElement('div');
            customInputContainer.className = 'custom-title-input';
            customInputContainer.innerHTML = `
                <input type="text" placeholder="请输入自定义标题" maxlength="50">
            `;
            this.themeSelector.insertBefore(customInputContainer, this.startConversationBtn);

            // 输入事件
            const input = customInputContainer.querySelector('input');
            input.addEventListener('input', () => {
                this.selectedTitle = input.value.trim();
                this.startConversationBtn.disabled = !this.selectedTitle;
            });

            input.focus();
        }
    }

    /**
     * 隐藏自定义标题输入
     */
    hideCustomTitleInput() {
        const customInputContainer = this.themeSelector.querySelector('.custom-title-input');
        if (customInputContainer) {
            customInputContainer.remove();
        }
    }

    /**
     * 加载主题标题
     * @param {string} theme - 主题
     * @returns {Promise<Array>} 标题列表
     */
    async loadThemeTitles(theme) {
        try {
            const response = await fetch('./data/themes.json');
            const data = await response.json();
            return data.themes[theme]?.titles || [];
        } catch (error) {
            console.error('加载主题标题失败:', error);
            return [];
        }
    }

    /**
     * 处理开始对话
     */
    handleStartConversation() {
        if (!this.selectedTheme) return;

        // 如果是自定义主题或自定义标题
        if (this.selectedTheme === 'custom' || !this.selectedTitle) {
            if (this.callbacks.onStartWithCustom) {
                this.callbacks.onStartWithCustom(this.selectedTheme, this.selectedTitle);
            }
        } else {
            // 使用选中的主题和标题
            if (this.callbacks.onStartWithTheme) {
                this.callbacks.onStartWithTheme(this.selectedTheme, this.selectedTitle);
            }
        }
    }

    /**
     * 显示主题选择器
     */
    show() {
        this.themeSelector.style.display = 'block';
    }

    /**
     * 隐藏主题选择器
     */
    hide() {
        this.themeSelector.style.display = 'none';
        this.reset();
    }

    /**
     * 重置选择状态
     */
    reset() {
        this.themeCards.forEach(card => card.classList.remove('selected'));
        this.selectedTheme = null;
        this.selectedTitle = null;
        this.startConversationBtn.disabled = true;
        this.hideTitleSelection();
    }

    /**
     * 获取选中的主题
     * @returns {string} 主题
     */
    getSelectedTheme() {
        return this.selectedTheme;
    }

    /**
     * 获取选中的标题
     * @returns {string} 标题
     */
    getSelectedTitle() {
        return this.selectedTitle;
    }
}