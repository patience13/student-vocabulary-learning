/**
 * 业务逻辑模块
 * 处理对话流程、词汇生成、提示词构建等核心业务逻辑
 */

import { apiManager } from './api.js';

/**
 * 对话管理器
 * 管理对话流程和状态
 */
export class ConversationManager {
    constructor() {
        this.state = 'IDLE'; // IDLE, ASKING_THEME, ASKING_TITLE, GENERATING
        this.currentTheme = null;
        this.currentTitle = null;
        this.messages = [];
    }

    /**
     * 开始新的对话
     */
    startConversation() {
        this.state = 'ASKING_THEME';
        this.currentTheme = null;
        this.currentTitle = null;
        this.messages = [];

        // 添加欢迎消息
        this.addMessage({
            type: 'system',
            content: '请问这期儿童识字小报的主题/场景是什么？（如：超市、医院、公园）'
        });

        return {
            state: this.state,
            message: this.messages[0]
        };
    }

    /**
     * 处理用户输入
     * @param {string} input - 用户输入
     * @returns {Object} 响应对象
     */
    async handleUserInput(input) {
        // 添加用户消息
        this.addMessage({
            type: 'user',
            content: input
        });

        switch (this.state) {
            case 'ASKING_THEME':
                this.currentTheme = input;
                this.state = 'ASKING_TITLE';

                const titleMessage = {
                    type: 'system',
                    content: '请问小报的大标题是什么？（如：《走进超市》《快乐医院》）'
                };
                this.addMessage(titleMessage);

                return {
                    state: this.state,
                    message: titleMessage,
                    nextStep: 'title'
                };

            case 'ASKING_TITLE':
                this.currentTitle = input;
                this.state = 'GENERATING';

                // 生成提示词
                const promptGenerator = new PromptGenerator();
                const prompt = await promptGenerator.generatePrompt(this.currentTheme, this.currentTitle);

                const promptMessage = {
                    type: 'ai',
                    content: '提示词已生成，正在生成小报图片...',
                    prompt: prompt
                };
                this.addMessage(promptMessage);

                return {
                    state: this.state,
                    message: promptMessage,
                    prompt: prompt,
                    theme: this.currentTheme,
                    title: this.currentTitle
                };

            default:
                throw new Error('Invalid conversation state');
        }
    }

    /**
     * 添加消息到对话历史
     * @param {Object} message - 消息对象
     */
    addMessage(message) {
        this.messages.push({
            ...message,
            id: Date.now().toString(),
            timestamp: Date.now()
        });
    }

    /**
     * 获取对话历史
     * @returns {Array} 消息列表
     */
    getMessages() {
        return [...this.messages];
    }

    /**
     * 重置对话
     */
    reset() {
        this.state = 'IDLE';
        this.currentTheme = null;
        this.currentTitle = null;
        this.messages = [];
    }
}

/**
 * 词汇生成器
 * 根据主题生成相关词汇
 */
export class VocabularyGenerator {
    constructor() {
        this.themes = null;
        this.loadThemes();
    }

    /**
     * 加载主题数据
     */
    async loadThemes() {
        try {
            const response = await fetch('./data/themes.json');
            const data = await response.json();
            this.themes = data.themes;
        } catch (error) {
            console.error('加载主题数据失败:', error);
            // 使用默认主题数据
            this.themes = this.getDefaultThemes();
        }
    }

    /**
     * 获取默认主题数据（作为备用）
     */
    getDefaultThemes() {
        return {
            "超市": {
                "name": "超市",
                "titles": ["走进超市", "快乐购物", "超市探险"],
                "vocabularies": {
                    "characters": [
                        {"pinyin": "shōu yín yuán", "chinese": "收银员"},
                        {"pinyin": "gù kè", "chinese": "顾客"}
                    ],
                    "items": [
                        {"pinyin": "píng guǒ", "chinese": "苹果"},
                        {"pinyin": "niú nǎi", "chinese": "牛奶"}
                    ],
                    "facilities": [
                        {"pinyin": "huò jià", "chinese": "货架"}
                    ],
                    "environment": [
                        {"pinyin": "zhāo pái", "chinese": "招牌"}
                    ]
                }
            }
        };
    }

    /**
     * 根据主题名称获取主题数据
     * @param {string} themeName - 主题名称
     * @returns {Object|null} 主题数据
     */
    getThemeByName(themeName) {
        if (!this.themes) return null;

        // 查找匹配的主题
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.name === themeName) {
                return theme;
            }
        }

        // 尝试模糊匹配
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.name.includes(themeName) || themeName.includes(theme.name)) {
                return theme;
            }
        }

        return null;
    }

    /**
     * 根据主题生成词汇
     * @param {string} theme - 主题
     * @returns {Object} 生成的词汇
     */
    async generateVocabulary(theme) {
        const themeData = this.getThemeByName(theme);

        if (themeData) {
            // 使用预设主题数据
            return themeData.vocabularies;
        } else {
            // 动态生成词汇（基于关键词）
            return this.generateDynamicVocabulary(theme);
        }
    }

    /**
     * 动态生成词汇（基于关键词）
     * @param {string} theme - 主题
     * @returns {Object} 生成的词汇
     */
    generateDynamicVocabulary(theme) {
        // 这里可以实现更复杂的词汇生成逻辑
        // 目前返回一个基本的词汇结构
        return {
            characters: [
                {"pinyin": "rén", "chinese": "人"},
                {"pinyin": "hái zi", "chinese": "孩子"}
            ],
            items: [
                {"pinyin": "wù pǐn", "chinese": "物品"},
                {"pinyin": "wán jù", "chinese": "玩具"}
            ],
            facilities: [
                {"pinyin": "shè shī", "chinese": "设施"}
            ],
            environment: [
                {"pinyin": "huán jìng", "chinese": "环境"}
            ]
        };
    }

    /**
     * 获取所有可用主题
     * @returns {Array} 主题列表
     */
    getAvailableThemes() {
        if (!this.themes) return [];

        return Object.entries(this.themes).map(([key, theme]) => ({
            id: key,
            name: theme.name,
            icon: theme.icon,
            titles: theme.titles
        }));
    }
}

/**
 * 提示词生成器
 * 根据主题和标题生成完整的AI绘图提示词
 */
export class PromptGenerator {
    constructor() {
        this.vocabularyGenerator = new VocabularyGenerator();
        this.template = `请生成一张儿童识字小报《{{主题/场景}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子 认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{标题}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{主题/场景}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{主题/场景}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{主题/场景}} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{主题/场景}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{核心角色与设施}}

**2. 常见物品/工具：**
{{常见物品工具}}

**3. 环境与装饰：**
{{环境与装饰}}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;
    }

    /**
     * 生成完整的提示词
     * @param {string} theme - 主题
     * @param {string} title - 标题
     * @returns {Promise<string>} 完整的提示词
     */
    async generatePrompt(theme, title) {
        // 获取词汇数据
        const vocabularies = await this.vocabularyGenerator.generateVocabulary(theme);

        // 格式化词汇列表
        const formattedVocabs = this.formatVocabularies(vocabularies);

        // 替换模板中的占位符
        let prompt = this.template
            .replace(/\{\{主题\/场景\}\}/g, theme)
            .replace(/\{\{标题\}\}/g, title)
            .replace(/\{\{核心角色与设施\}\}/g, formattedVocabs.characters)
            .replace(/\{\{常见物品工具\}\}/g, formattedVocabs.items)
            .replace(/\{\{环境与装饰\}\}/g, formattedVocabs.environment);

        return prompt;
    }

    /**
     * 格式化词汇列表
     * @param {Object} vocabularies - 词汇对象
     * @returns {Object} 格式化后的词汇
     */
    formatVocabularies(vocabularies) {
        const formatList = (list) => {
            return list.map(item => `${item.pinyin} ${item.chinese}`).join(', ');
        };

        return {
            characters: formatList(vocabularies.characters || []),
            items: formatList(vocabularies.items || vocabularies.animals || []), // 兼容动物园的animals字段
            environment: formatList([...(vocabularies.facilities || []), ...(vocabularies.environment || [])])
        };
    }
}

/**
 * 图片生成管理器
 * 管理图片生成流程
 */
export class ImageGenerationManager {
    constructor() {
        this.promptGenerator = new PromptGenerator();
    }

    /**
     * 生成图片
     * @param {string} theme - 主题
     * @param {string} title - 标题
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<string>} 图片URL
     */
    async generateImage(theme, title, onProgress = null) {
        try {
            // 生成提示词
            const prompt = await this.promptGenerator.generatePrompt(theme, title);

            // 调用API生成图片
            const imageUrl = await apiManager.generateImage(prompt, {}, onProgress);

            return imageUrl;
        } catch (error) {
            console.error('生成图片失败:', error);
            throw error;
        }
    }

    /**
     * 下载图片
     * @param {string} imageUrl - 图片URL
     * @param {string} filename - 文件名
     */
    downloadImage(imageUrl, filename = '儿童识字小报.png') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * 主业务控制器
 * 统一管理各个业务模块
 */
export class BusinessController {
    constructor() {
        this.conversationManager = new ConversationManager();
        this.vocabularyGenerator = new VocabularyGenerator();
        this.imageGenerationManager = new ImageGenerationManager();
    }

    /**
     * 获取对话管理器
     */
    getConversationManager() {
        return this.conversationManager;
    }

    /**
     * 获取词汇生成器
     */
    getVocabularyGenerator() {
        return this.vocabularyGenerator;
    }

    /**
     * 获取图片生成管理器
     */
    getImageGenerationManager() {
        return this.imageGenerationManager;
    }

    /**
     * 开始创建新的小报
     */
    startNewCreation() {
        this.conversationManager.reset();
        return this.conversationManager.startConversation();
    }

    /**
     * 处理用户选择的主题
     * @param {string} theme - 选择的主题
     * @returns {Object} 主题数据
     */
    handleThemeSelection(theme) {
        const themeData = this.vocabularyGenerator.getThemeByName(theme);
        if (themeData) {
            return {
                theme: theme,
                titles: themeData.titles,
                vocabularies: themeData.vocabularies
            };
        }
        return null;
    }

    /**
     * 使用选中的主题和标题创建小报
     * @param {string} theme - 主题
     * @param {string} title - 标题
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<string>} 图片URL
     */
    async createWithThemeAndTitle(theme, title, onProgress) {
        try {
            const imageUrl = await this.imageGenerationManager.generateImage(
                theme,
                title,
                onProgress
            );
            return imageUrl;
        } catch (error) {
            console.error('创建小报失败:', error);
            throw error;
        }
    }
}

// 创建全局业务控制器实例
export const businessController = new BusinessController();