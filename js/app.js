/**
 * 儿童识字小报生成器 - 主应用入口
 */

// 动态导入模块
async function loadModules() {
    try {
        const { apiManager } = await import('./modules/api.js');
        const { businessController } = await import('./modules/business.js');
        const { DialogComponent, InputComponent } = await import('./components/dialog.js');
        const { ImageViewerComponent, ThemeSelectorComponent } = await import('./components/image-viewer.js');
        const { SettingsComponent } = await import('./components/settings.js');

        return {
            apiManager,
            businessController,
            DialogComponent,
            InputComponent,
            ImageViewerComponent,
            ThemeSelectorComponent,
            SettingsComponent
        };
    } catch (error) {
        console.error('模块加载失败:', error);
        throw error;
    }
}

/**
 * 主应用类
 */
class VocabularyApp {
    constructor(modules) {
        // 保存模块引用
        this.modules = modules;

        // 获取容器元素
        this.container = document.querySelector('.app-container');
        if (!this.container) {
            throw new Error('找不到应用容器元素');
        }

        // 初始化组件
        this.dialogComponent = new modules.DialogComponent(this.container);
        this.inputComponent = new modules.InputComponent(this.container);
        this.imageViewerComponent = new modules.ImageViewerComponent(this.container);
        this.themeSelectorComponent = new modules.ThemeSelectorComponent(this.container);
        this.settingsComponent = new modules.SettingsComponent(this.container);

        // 应用状态
        this.state = {
            currentTheme: null,
            currentTitle: null,
            isGenerating: false
        };

        // 初始化应用
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('开始初始化应用...');

            // 检查API配置
            this.checkApiConfiguration();

            // 设置组件回调
            this.setupComponentCallbacks();

            // 显示欢迎界面
            this.showWelcomeInterface();

            console.log('应用初始化成功');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 检查API配置
     */
    checkApiConfiguration() {
        if (!this.modules.apiManager.isConfigured()) {
            // 显示API设置提示
            this.showApiConfigurationHint();
        }
    }

    /**
     * 设置组件回调
     */
    setupComponentCallbacks() {
        // 输入组件回调
        this.inputComponent.setCallback(async (input) => {
            await this.handleUserInput(input);
        });

        // 图片查看器回调
        this.imageViewerComponent.setCallbacks({
            onDownload: (imageUrl) => {
                this.downloadImage(imageUrl);
            },
            onRegenerate: () => {
                this.regenerateImage();
            },
            onNewCreate: () => {
                this.startNewCreation();
            }
        });

        // 主题选择器回调
        this.themeSelectorComponent.setCallbacks({
            onCustomTheme: () => {
                this.startCustomConversation();
            },
            onStartWithTheme: (theme, title) => {
                this.startWithTheme(theme, title);
            },
            onStartWithCustom: (theme, title) => {
                this.startWithCustom(theme, title);
            }
        });

        // 设置组件回调
        this.settingsComponent.setCallbacks({
            onSave: async (settings) => {
                await this.handleSettingsSave(settings);
            }
        });
    }

    /**
     * 显示欢迎界面
     */
    showWelcomeInterface() {
        // 添加欢迎消息
        this.dialogComponent.addMessage({
            type: 'system',
            content: '欢迎使用儿童识字小报生成器！\n\n我将帮助您创建适合5-9岁儿童的识字学习小报。'
        });

        // 显示主题选择器
        this.themeSelectorComponent.show();
    }

    /**
     * 显示API配置提示
     */
    showApiConfigurationHint() {
        this.dialogComponent.addMessage({
            type: 'system',
            content: '⚠️ 提醒：您还未配置API Key，点击右上角的"API设置"进行配置后才能生成小报。'
        });
    }

    /**
     * 开始自定义对话
     */
    startCustomConversation() {
        // 隐藏主题选择器
        this.themeSelectorComponent.hide();

        // 开始对话流程
        const conversationManager = businessController.getConversationManager();
        const result = conversationManager.startConversation();

        // 显示对话消息
        this.dialogComponent.addMessage(result.message);

        // 显示输入区域
        this.inputComponent.show();
        this.inputComponent.setPlaceholder('请输入主题/场景...');
    }

    /**
     * 使用选中的主题和标题开始
     * @param {string} theme - 主题
     * @param {string} title - 标题
     */
    async startWithTheme(theme, title) {
        // 隐藏主题选择器
        this.themeSelectorComponent.hide();

        // 保存状态
        this.state.currentTheme = theme;
        this.state.currentTitle = title;

        // 添加确认消息
        this.dialogComponent.addMessage({
            type: 'user',
            content: `主题：${theme}\n标题：${title}`
        });

        this.dialogComponent.addMessage({
            type: 'system',
            content: '已选择主题和标题，正在生成小报...'
        });

        // 开始生成图片
        await this.generateImage(theme, title);
    }

    /**
     * 开始自定义主题和标题
     * @param {string} theme - 主题
     * @param {string} title - 标题
     */
    async startWithCustom(theme, title) {
        // 隐藏主题选择器
        this.themeSelectorComponent.hide();

        // 保存状态
        this.state.currentTheme = theme || '自定义';
        this.state.currentTitle = title;

        // 添加确认消息
        this.dialogComponent.addMessage({
            type: 'user',
            content: `主题：${theme || '自定义'}\n标题：${title || '待输入'}`
        });

        // 如果标题为空，请求输入标题
        if (!title) {
            this.dialogComponent.addMessage({
                type: 'system',
                content: '请输入小报标题：'
            });
            this.inputComponent.show();
            this.inputComponent.setPlaceholder('请输入标题...');
            return;
        }

        // 开始生成图片
        this.dialogComponent.addMessage({
            type: 'system',
            content: '正在生成小报...'
        });

        await this.generateImage(theme || '自定义', title);
    }

    /**
     * 处理用户输入
     * @param {string} input - 用户输入
     */
    async handleUserInput(input) {
        const conversationManager = this.modules.businessController.getConversationManager();

        try {
            // 处理用户输入
            const result = await conversationManager.handleUserInput(input);

            // 添加响应消息
            if (result.message) {
                this.dialogComponent.addMessage(result.message);
            }

            // 如果需要生成图片
            if (result.state === 'GENERATING' && result.prompt && result.theme && result.title) {
                // 保存状态
                this.state.currentTheme = result.theme;
                this.state.currentTitle = result.title;

                // 隐藏输入区域
                this.inputComponent.hide();

                // 开始生成图片
                await this.generateImage(result.theme, result.title);
            } else if (result.nextStep === 'title') {
                // 更新输入框占位符
                this.inputComponent.setPlaceholder('请输入标题...');
            }
        } catch (error) {
            console.error('处理用户输入失败:', error);
            this.dialogComponent.addMessage({
                type: 'system',
                content: '处理失败：' + error.message
            });
        }
    }

    /**
     * 生成图片
     * @param {string} theme - 主题
     * @param {string} title - 标题
     */
    async generateImage(theme, title) {
        if (this.state.isGenerating) {
            console.warn('图片生成中，忽略重复请求');
            return;
        }

        this.state.isGenerating = true;

        try {
            // 显示进度
            const onProgress = (progress) => {
                this.imageViewerComponent.showProgress(progress);
            };

            // 生成图片
            const imageUrl = await this.modules.businessController.createWithThemeAndTitle(
                theme,
                title,
                onProgress
            );

            // 显示生成的图片
            this.imageViewerComponent.showImage(imageUrl);

            // 添加成功消息
            this.dialogComponent.addMessage({
                type: 'system',
                content: '✅ 小报生成成功！'
            });

        } catch (error) {
            console.error('生成图片失败:', error);

            // 显示错误
            this.imageViewerComponent.showError(error.message);

            // 添加错误消息
            this.dialogComponent.addMessage({
                type: 'system',
                content: '❌ 生成失败：' + error.message
            });

            // 重新显示输入区域
            this.inputComponent.show();
        } finally {
            this.state.isGenerating = false;
        }
    }

    /**
     * 下载图片
     * @param {string} imageUrl - 图片URL
     */
    downloadImage(imageUrl) {
        try {
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `儿童识字小报_${this.state.currentTheme || '自定义'}_${timestamp}.png`;

            // 下载图片
            this.imageViewerComponent.downloadImage(filename);

            console.log('图片下载成功:', filename);
        } catch (error) {
            console.error('下载图片失败:', error);
            this.showError('下载失败，请右键保存图片');
        }
    }

    /**
     * 重新生成图片
     */
    async regenerateImage() {
        if (!this.state.currentTheme || !this.state.currentTitle) {
            this.showError('无法重新生成：主题或标题信息丢失');
            return;
        }

        // 重置图片查看器
        this.imageViewerComponent.reset();

        // 重新生成
        await this.generateImage(this.state.currentTheme, this.state.currentTitle);
    }

    /**
     * 开始新的创建
     */
    startNewCreation() {
        // 重置状态
        this.state.currentTheme = null;
        this.state.currentTitle = null;
        this.state.isGenerating = false;

        // 重置组件
        this.imageViewerComponent.reset();
        this.dialogComponent.clear();
        this.themeSelectorComponent.reset();

        // 清空对话历史
        this.modules.businessController.getConversationManager().reset();

        // 显示欢迎界面
        this.showWelcomeInterface();
    }

    /**
     * 处理设置保存
     * @param {Object} settings - 设置对象
     */
    async handleSettingsSave(settings) {
        try {
            // 更新API管理器设置
            if (settings.apiKey) {
                this.modules.apiManager.saveApiKey(settings.apiKey);
            }

            this.modules.apiManager.updateSettings({
                resolution: settings.resolution,
                format: settings.format
            });

            console.log('设置保存成功');
        } catch (error) {
            console.error('保存设置失败:', error);
            throw error;
        }
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        alert('错误：' + message);
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态
     */
    getState() {
        return { ...this.state };
    }
}

/**
 * 应用启动
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM加载完成，开始初始化应用...');

        // 加载模块
        const modules = await loadModules();
        console.log('模块加载成功');

        // 创建应用实例
        window.app = new VocabularyApp(modules);
        console.log('应用实例创建成功');

        // 添加全局错误处理
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
        });

        // 添加未处理的Promise拒绝处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason);
            event.preventDefault();
        });

    } catch (error) {
        console.error('应用启动失败:', error);

        // 显示错误信息给用户
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1 style="color: #F44336;">应用启动失败</h1>
                <p>错误信息: ${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
    }
});

// 导出应用实例（用于调试）
export default window.app;