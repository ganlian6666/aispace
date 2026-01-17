import { getLocale, t } from './utils/i18n.js';

// Skills 数据 - 拆分为 Skills 和 MCP
const skillsData = {
    // Skills 插件类
    skills: {
        hot: [
            {
                id: 'skill-hot-1',
                name: 'Superpowers Plugin',
                desc: { zh: '20+ 生产级技能包，包含 TDD、系统调试、结构化规划等工作流', en: '20+ production-grade skills including TDD, systematic debugging, and structured planning workflows' },
                install: 'claude install superpowers',
                usage: 'claude /superpowers',
                github: 'https://github.com/anthropics/superpowers'
            },
            {
                id: 'skill-hot-2',
                name: 'Code-Simplifier Plugin',
                desc: { zh: 'Anthropic 官方开源的智能重构工具，降低 20-30% Token 消耗', en: 'Official Anthropic refactoring agent, reduces token usage by 20-30%' },
                install: 'claude install code-simplifier',
                usage: 'claude /simplify',
                github: 'https://github.com/anthropics/code-simplifier'
            },
            {
                id: 'skill-hot-5',
                name: 'Ralph Loop Plugin',
                desc: { zh: '让 Claude Code 自主运行更长时间，解决上下文限制', en: 'Enable Claude Code to run autonomously for extended periods' },
                install: 'claude install ralph-loop',
                usage: 'claude /loop',
                github: 'https://github.com/ralph-loop/plugin'
            }
        ],
        aiml: [
            {
                id: 'skill-aiml-1',
                name: 'Context Optimization',
                desc: { zh: 'LLM 上下文优化策略，Token 减少、成本节约、性能提升', en: 'LLM context optimization strategies: token reduction, cost saving, performance boost' },
                install: 'claude /install muratcankoylan/Agent-Skills-for-Context-Engineering --skill context-optimization',
                usage: 'claude /context-optimization',
                github: 'https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering'
            },
            {
                id: 'skill-aiml-2',
                name: 'Memory Management',
                desc: { zh: '长上下文 LLM 交互的策略性记忆处理', en: 'Strategic memory handling for long-context LLM interactions' },
                install: 'claude /install anthropics/skills --skill memory-management',
                usage: 'claude /memory',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-aiml-3',
                name: 'Token Counter',
                desc: { zh: '实时 Token 计数和成本估算', en: 'Real-time token counting and cost estimation' },
                install: 'claude /install anthropics/skills --skill token-counter',
                usage: 'claude /tokens',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        design: [
            {
                id: 'skill-design-2',
                name: 'Frontend Design Plugin',
                desc: { zh: '生成生产级前端界面，避免 AI 通用风格', en: 'Create production-grade frontend interfaces' },
                install: 'claude install frontend-design',
                usage: 'claude /design',
                github: 'https://github.com/anthropics/claude-code-plugins'
            }
        ],
        data: [
            {
                id: 'skill-data-1',
                name: 'XLSX Operations',
                desc: { zh: '专业 Excel 操作，遵循金融建模标准', en: 'Professional Excel operations following financial modeling standards' },
                install: 'claude /install anthropics/skills --skill xlsx',
                usage: 'claude /xlsx',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-data-2',
                name: 'CSV Parser',
                desc: { zh: '高效 CSV 数据解析与转换', en: 'Efficient CSV data parsing and transformation' },
                install: 'claude /install anthropics/skills --skill csv',
                usage: 'claude /csv',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-data-3',
                name: 'JSON Transformer',
                desc: { zh: 'JSON 数据结构转换与验证', en: 'JSON data structure transformation and validation' },
                install: 'claude /install anthropics/skills --skill json',
                usage: 'claude /json',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        docs: [
            {
                id: 'skill-docs-1',
                name: 'Docs Review',
                desc: { zh: '文档审查，含样式指南、检查清单和质量评分', en: 'Documentation review with style guides, checklists, and quality scoring' },
                install: 'claude /install anthropics/skills --skill docs-review',
                usage: 'claude /docs-review',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-docs-2',
                name: 'Doc Coauthoring',
                desc: { zh: '结构化三阶段文档协作（规划、起草、润色）', en: 'Structured 3-stage document collaboration: Plan, Draft, Refine' },
                install: 'claude /install anthropics/skills --skill doc-coauthoring',
                usage: 'claude /coauthor',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-docs-3',
                name: 'README Generator',
                desc: { zh: '自动生成专业 README 文件', en: 'Auto-generate professional README files' },
                install: 'claude /install anthropics/skills --skill readme',
                usage: 'claude /readme',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        efficiency: [
            {
                id: 'skill-efficiency-1',
                name: 'Browser Control',
                desc: { zh: '高级浏览器交互和任务自动化', en: 'Advanced browser interaction and task automation' },
                install: 'claude /install anthropics/skills --skill browser-control',
                usage: 'claude /browser',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-efficiency-2',
                name: 'File Search',
                desc: { zh: '使用 ripgrep 和 ast-grep 高效搜索代码库', en: 'Efficient codebase searching using ripgrep and ast-grep' },
                install: 'claude /install anthropics/skills --skill file-search',
                usage: 'claude /search',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-efficiency-3',
                name: 'Systematic Debugging',
                desc: { zh: '结构化方法调试复杂代码库', en: 'Structured method for debugging complex codebases' },
                install: 'claude /install anthropics/skills --skill systematic-debugging',
                usage: 'claude /debug',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-efficiency-4',
                name: 'Verification Quality',
                desc: { zh: '自动代码质量验证和真实性评分', en: 'Automated code quality verification with authenticity scoring' },
                install: 'claude /install anthropics/skills --skill verification-quality',
                usage: 'claude /verify',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        writing: [
            {
                id: 'skill-writing-1',
                name: 'Technical Writing',
                desc: { zh: '技术文档写作指南和模板', en: 'Technical documentation writing guides and templates' },
                install: 'claude /install anthropics/skills --skill tech-writing',
                usage: 'claude /tech-write',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-writing-2',
                name: 'Blog Post Generator',
                desc: { zh: '结构化博客文章生成', en: 'Structured blog post generation' },
                install: 'claude /install anthropics/skills --skill blog',
                usage: 'claude /blog',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        meta: [
            {
                id: 'skill-meta-1',
                name: 'MCP Builder',
                desc: { zh: '结构化工作流：研究、实现和测试新 MCP 服务器', en: 'Structured workflow for researching, implementing, and testing new MCP servers' },
                install: 'claude /install anthropics/skills --skill mcp-builder',
                usage: 'claude /mcp-builder',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-meta-2',
                name: 'Skill Builder',
                desc: { zh: '元技能：指导创建高质量 Claude Skills', en: 'Meta-skill for creating compliant and high-quality Claude skills' },
                install: 'claude /install anthropics/skills --skill skill-builder',
                usage: 'claude /skill-builder',
                github: 'https://github.com/anthropics/skills'
            },
            {
                id: 'skill-meta-3',
                name: 'API Integrator',
                desc: { zh: '标准化工作流：集成和测试第三方 API', en: 'Standardized workflow for integrating and testing third-party APIs' },
                install: 'claude /install anthropics/skills --skill api-integrator',
                usage: 'claude /integrate',
                github: 'https://github.com/anthropics/skills'
            }
        ],
        dev: [
            {
                id: 'skill-dev-3',
                name: 'Code Review Plugin',
                desc: { zh: '自动化 PR 代码审查，使用专门的审查 Agent', en: 'Automated PR code review using specialized agents' },
                install: 'claude install code-review',
                usage: 'claude /review PR_URL',
                github: 'https://github.com/anthropics/claude-code-plugins'
            }
        ]
    },

    // MCP 服务器类
    mcp: {
        hot: [
            {
                id: 'skill-hot-3',
                name: 'Sequential Thinking MCP',
                desc: { zh: '结构化问题解决，复杂任务分步推理', en: 'Structured problem-solving for complex multi-step reasoning tasks' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server sequential-thinking',
                usage: '在 Claude 中自动启用结构化思维',
                github: 'https://github.com/modelcontextprotocol/servers'
            },
            {
                id: 'skill-hot-4',
                name: 'Context7 MCP',
                desc: { zh: '实时获取官方文档，版本特定，减少 Token 开销', en: 'Fetch up-to-date, version-specific documentation from official sources' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server context7',
                usage: 'claude mcp add context7',
                github: 'https://github.com/context7/mcp-server'
            }
        ],
        dev: [
            {
                id: 'skill-dev-1',
                name: 'GitHub MCP Server',
                desc: { zh: '管理 GitHub Issues、PR、代码分析、提交历史', en: 'Manage GitHub Issues, PRs, code analysis, and commit history' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server github',
                usage: 'claude mcp add github -- --token YOUR_TOKEN',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github'
            },
            {
                id: 'skill-dev-2',
                name: 'Git MCP',
                desc: { zh: '本地 Git 仓库操作，提交、分支、合并', en: 'Local Git repository operations: commit, branch, merge' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server git',
                usage: 'claude mcp add git',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git'
            }
        ],
        db: [
            {
                id: 'skill-db-1',
                name: 'PostgreSQL MCP',
                desc: { zh: '自然语言查询 PostgreSQL 数据库', en: 'Query PostgreSQL databases using natural language' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server postgres',
                usage: 'claude mcp add postgres -- --connection-string YOUR_URL',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres'
            },
            {
                id: 'skill-db-2',
                name: 'SQLite MCP',
                desc: { zh: '本地 SQLite 数据库操作', en: 'Local SQLite database operations' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server sqlite',
                usage: 'claude mcp add sqlite -- --db-path ./data.db',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite'
            },
            {
                id: 'skill-db-3',
                name: 'Supabase MCP',
                desc: { zh: 'Supabase 数据库和认证集成', en: 'Supabase database and authentication integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server supabase',
                usage: 'claude mcp add supabase -- --url YOUR_URL --key YOUR_KEY',
                github: 'https://github.com/supabase/mcp-server'
            },
            {
                id: 'skill-db-4',
                name: 'Chroma MCP',
                desc: { zh: '向量数据库操作，语义搜索', en: 'Vector database operations and semantic search' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server chroma',
                usage: 'claude mcp add chroma',
                github: 'https://github.com/chroma-core/mcp-server'
            }
        ],
        fs: [
            {
                id: 'skill-fs-1',
                name: 'File System MCP',
                desc: { zh: '高级本地文件读写操作', en: 'Advanced local file read/write operations' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server filesystem',
                usage: 'claude mcp add filesystem -- --allow-write /path/to/dir',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem'
            },
            {
                id: 'skill-fs-2',
                name: 'Memory Bank MCP',
                desc: { zh: '持久化上下文存储，跨会话记忆', en: 'Persistent context storage across sessions' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server memory',
                usage: 'claude mcp add memory',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory'
            }
        ],
        web: [
            {
                id: 'skill-web-1',
                name: 'Puppeteer MCP',
                desc: { zh: 'Chrome 浏览器自动化，网页抓取', en: 'Chrome browser automation and web scraping' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server puppeteer',
                usage: 'claude mcp add puppeteer',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer'
            },
            {
                id: 'skill-web-2',
                name: 'Playwright MCP',
                desc: { zh: '跨浏览器自动化测试', en: 'Cross-browser automation testing' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server playwright',
                usage: 'claude mcp add playwright',
                github: 'https://github.com/anthropics/mcp-playwright'
            },
            {
                id: 'skill-web-3',
                name: 'Fetch MCP',
                desc: { zh: 'HTTP 请求工具，API 调用', en: 'HTTP request tool for API calls' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server fetch',
                usage: 'claude mcp add fetch',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch'
            }
        ],
        knowledge: [
            {
                id: 'skill-knowledge-1',
                name: 'Notion MCP',
                desc: { zh: '同步 Notion 文档和数据库', en: 'Sync Notion documents and databases' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server notion',
                usage: 'claude mcp add notion -- --token YOUR_TOKEN',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/notion'
            },
            {
                id: 'skill-knowledge-2',
                name: 'Obsidian MCP',
                desc: { zh: '本地 Obsidian 知识库集成', en: 'Local Obsidian knowledge base integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server obsidian',
                usage: 'claude mcp add obsidian -- --vault /path/to/vault',
                github: 'https://github.com/anthropics/mcp-obsidian'
            },
            {
                id: 'skill-knowledge-3',
                name: 'Google Drive MCP',
                desc: { zh: 'Google Drive 文档集成', en: 'Google Drive document integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server gdrive',
                usage: 'claude mcp add gdrive',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive'
            }
        ],
        design: [
            {
                id: 'skill-design-1',
                name: 'Figma MCP',
                desc: { zh: '从 Figma 设计稿生成代码', en: 'Generate code from Figma designs' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server figma',
                usage: 'claude mcp add figma -- --token YOUR_TOKEN',
                github: 'https://github.com/anthropics/mcp-figma'
            }
        ],
        search: [
            {
                id: 'skill-search-1',
                name: 'Brave Search MCP',
                desc: { zh: 'Brave 搜索引擎集成', en: 'Brave search engine integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server brave-search',
                usage: 'claude mcp add brave-search -- --api-key YOUR_KEY',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search'
            },
            {
                id: 'skill-search-2',
                name: 'Google Search MCP',
                desc: { zh: 'Google 搜索集成', en: 'Google search integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server google-search',
                usage: 'claude mcp add google-search -- --api-key YOUR_KEY',
                github: 'https://github.com/anthropics/mcp-google-search'
            }
        ],
        devops: [
            {
                id: 'skill-devops-1',
                name: 'Docker MCP',
                desc: { zh: 'Docker 容器管理', en: 'Docker container management' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server docker',
                usage: 'claude mcp add docker',
                github: 'https://github.com/anthropics/mcp-docker'
            },
            {
                id: 'skill-devops-2',
                name: 'Azure DevOps MCP',
                desc: { zh: 'Azure 流水线和仓库集成', en: 'Azure pipelines and repository integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server azure-devops',
                usage: 'claude mcp add azure-devops -- --org YOUR_ORG',
                github: 'https://github.com/microsoft/mcp-azure-devops'
            },
            {
                id: 'skill-devops-3',
                name: 'AWS Bedrock MCP',
                desc: { zh: 'AWS Bedrock AI 服务集成', en: 'AWS Bedrock AI service integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server bedrock',
                usage: 'claude mcp add bedrock',
                github: 'https://github.com/aws/mcp-bedrock'
            }
        ],
        comm: [
            {
                id: 'skill-comm-1',
                name: 'Slack MCP',
                desc: { zh: 'Slack 消息和频道集成', en: 'Slack messaging and channel integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server slack',
                usage: 'claude mcp add slack -- --token YOUR_TOKEN',
                github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack'
            },
            {
                id: 'skill-comm-2',
                name: 'Discord MCP',
                desc: { zh: 'Discord 服务器和消息集成', en: 'Discord server and message integration' },
                install: 'npx -y @anthropic-ai/create-mcp@latest --server discord',
                usage: 'claude mcp add discord -- --token YOUR_TOKEN',
                github: 'https://github.com/anthropics/mcp-discord'
            }
        ]
    }
};

const categories = {
    skills: [
        { key: 'hot', labelKey: 'skills_cat_hot' },
        { key: 'aiml', labelKey: 'skills_cat_aiml' },
        { key: 'data', labelKey: 'skills_cat_data' },
        { key: 'docs', labelKey: 'skills_cat_docs' },
        { key: 'efficiency', labelKey: 'skills_cat_efficiency' },
        { key: 'writing', labelKey: 'skills_cat_writing' },
        { key: 'meta', labelKey: 'skills_cat_meta' },
        { key: 'dev', labelKey: 'skills_cat_dev' },
        { key: 'design', labelKey: 'skills_cat_design' }
    ],
    mcp: [
        { key: 'hot', labelKey: 'skills_cat_hot' },
        { key: 'dev', labelKey: 'skills_cat_dev' },
        { key: 'db', labelKey: 'skills_cat_db' },
        { key: 'fs', labelKey: 'skills_cat_fs' },
        { key: 'web', labelKey: 'skills_cat_web' },
        { key: 'knowledge', labelKey: 'skills_cat_knowledge' },
        { key: 'design', labelKey: 'skills_cat_design' },
        { key: 'search', labelKey: 'skills_cat_search' },
        { key: 'devops', labelKey: 'skills_cat_devops' },
        { key: 'comm', labelKey: 'skills_cat_comm' }
    ]
};

function generateSkillCard(skill, locale, T, likesMap, commentsMap) {
    const desc = typeof skill.desc === 'object' ? skill.desc[locale] || skill.desc.en : skill.desc;
    const likeCount = likesMap[skill.id] || 0;
    const commentCount = commentsMap[skill.id] || 0;
    const isHot = skill.id.includes('-hot-');
    const isMcp = skill.install && skill.install.includes('create-mcp');

    return `
    <div class="skill-card" data-skill-id="${skill.id}">
      <div class="skill-header">
        <h3 class="skill-name">${skill.name}</h3>
        ${isHot ? `<span class="skill-badge hot">NEW</span>` : (isMcp ? `<span class="skill-badge">MCP</span>` : `<span class="skill-badge">Skill</span>`)}
      </div>
      <p class="skill-desc">${desc}</p>
      
      <div class="skill-section">
        <h4>
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${T('skills_install')}
        </h4>
        <div class="skill-code">
          <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
          <code>${skill.install}</code>
        </div>
      </div>
      
      <div class="skill-section">
        <h4>
          <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          ${T('skills_usage')}
        </h4>
        <div class="skill-code">
          <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
          <code>${skill.usage}</code>
        </div>
      </div>
      
      <div class="skill-links">
        <a href="${skill.github}" target="_blank" rel="noopener noreferrer" class="skill-link">
          <svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          ${T('skills_github')}
        </a>
      </div>
      
      <div class="skill-footer">
        <div class="skill-actions">
          <button class="skill-action-btn" onclick="likeSkill('${skill.id}', this)">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="like-count">${likeCount}</span>
          </button>
          <button class="skill-action-btn" onclick="toggleComments('${skill.id}', this)">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="comment-count">${commentCount}</span>
          </button>
        </div>
      </div>
      
      <div class="skill-comments" id="comments-${skill.id}">
        <div class="skill-comment-list" id="comment-list-${skill.id}">
          <div style="color:#999; font-size:12px; text-align:center;">${T('loading')}</div>
        </div>
        <div class="skill-comment-form">
          <input type="text" class="skill-comment-input" id="comment-input-${skill.id}" placeholder="${T('comment_placeholder')}">
          <button class="skill-comment-submit" onclick="submitComment('${skill.id}')">${T('btn_send')}</button>
        </div>
      </div>
    </div>
  `;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const cookie = request.headers.get('Cookie');
    const locale = getLocale(request.headers.get('Accept-Language'), cookie);
    const T = (key, vars) => t(locale, key, vars);

    // 获取点赞和评论统计
    let likesMap = {};
    let commentsMap = {};

    try {
        const { results: likeResults } = await env.DB.prepare(
            "SELECT card_id, COUNT(*) as count FROM likes WHERE card_id LIKE 'skill-%' GROUP BY card_id"
        ).all();
        likeResults.forEach(r => likesMap[r.card_id] = r.count);

        const { results: commentResults } = await env.DB.prepare(
            "SELECT card_id, COUNT(*) as count FROM comments WHERE card_id LIKE 'skill-%' GROUP BY card_id"
        ).all();
        commentResults.forEach(r => commentsMap[r.card_id] = r.count);
    } catch (err) {
        console.error('Error fetching likes/comments:', err);
    }

    // 生成 Skills 标签和内容
    const skillsTabsHtml = categories.skills.map((cat, idx) =>
        `<button class="skill-tab${idx === 0 ? ' active' : ''}" data-type="skills" data-category="${cat.key}">${T(cat.labelKey)}</button>`
    ).join('');

    const skillsContentsHtml = categories.skills.map((cat, idx) => {
        const skills = skillsData.skills[cat.key] || [];
        const cardsHtml = skills.map(skill => generateSkillCard(skill, locale, T, likesMap, commentsMap)).join('');
        return `
      <div class="category-content${idx === 0 ? ' active' : ''}" id="skills-${cat.key}">
        <div class="skills-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
    }).join('');

    // 生成 MCP 标签和内容
    const mcpTabsHtml = categories.mcp.map((cat, idx) =>
        `<button class="skill-tab${idx === 0 ? ' active' : ''}" data-type="mcp" data-category="${cat.key}">${T(cat.labelKey)}</button>`
    ).join('');

    const mcpContentsHtml = categories.mcp.map((cat, idx) => {
        const skills = skillsData.mcp[cat.key] || [];
        const cardsHtml = skills.map(skill => generateSkillCard(skill, locale, T, likesMap, commentsMap)).join('');
        return `
      <div class="category-content${idx === 0 ? ' active' : ''}" id="mcp-${cat.key}">
        <div class="skills-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T('skills_page_title')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/theme.css">
</head>

<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T('brand_name')}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            ${T('brand_subtitle')}
          </p>
        </div>
      </div>
      <nav>
        <a href="/">${T('nav_home')}</a>
        <a href="/news">${T('nav_news')}</a>
        <a href="/vpn">${T('nav_vpn')}</a>
        <a href="/guide">${T('nav_guide')}</a>
        <a href="/skills" class="active">${T('nav_skills')}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
          <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer" style="color:var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px; height:20px; fill:currentColor;">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span style="font-size:14px;">${T('github_text')}</span>
          </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          ${locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>
    </header>

    <section class="hero">
      <div>
        <h1>${T('skills_hero_title')}</h1>
        <p>${T('skills_hero_desc')}</p>
      </div>
    </section>

    <div class="content-wrapper">
      <!-- Main Type Tabs (Windows/macOS/Linux style) -->
      <div class="os-tabs" style="margin-bottom: 24px;">
        <button class="os-tab active" data-type="skills" style="width: auto; padding: 12px 24px; font-weight: 600;">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            ${T('skills_tab_skills')}
        </button>
        <button class="os-tab" data-type="mcp" style="width: auto; padding: 12px 24px; font-weight: 600;">
            <svg viewBox="0 0 24 24"><path d="M20 7h-9.5A2.5 2.5 0 0 0 8 9.5v8a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5V7z"/></svg>
            ${T('skills_tab_mcp')}
        </button>
      </div>

      <!-- Skills Content -->
      <div class="main-content active" id="main-skills">
        <div class="skills-tabs">
          ${skillsTabsHtml}
        </div>
        ${skillsContentsHtml}
      </div>

      <!-- MCP Content -->
      <div class="main-content" id="main-mcp" style="display: none;">
        <div class="skills-tabs">
          ${mcpTabsHtml}
        </div>
        ${mcpContentsHtml}
      </div>
    </div>
  </div>

  <style>
    .category-content { display: none; }
    .category-content.active { display: block; animation: fadeIn 0.3s ease; }
    .os-tab.active { background: #5b8def; color: #fff; border-color: #5b8def; }
    .os-tab.active svg { fill: #fff; }
    .main-content { animation: fadeIn 0.3s ease; }
  </style>

  <script>
    // Language Switcher
    function switchLanguage() {
      const currentLocale = '${locale}';
      const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
      document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
      window.location.reload();
    }

    // Main Type Tabs (Skills vs MCP)
    document.querySelectorAll('.os-tab[data-type]').forEach(tab => {
        tab.addEventListener('click', () => {
            // Switch Tab Active State
            document.querySelectorAll('.os-tab[data-type]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show Content
            const type = tab.dataset.type;
            document.querySelectorAll('.main-content').forEach(c => c.style.display = 'none');
            document.getElementById('main-' + type).style.display = 'block';
        });
    });

    // Category Tabs Logic
    document.querySelectorAll('.skill-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.type; // skills or mcp
        const category = tab.dataset.category;
        
        // Find container for this type
        const container = document.getElementById('main-' + type);
        
        // Update active tab within this container
        container.querySelectorAll('.skill-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content within this container
        container.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
        container.querySelector('#' + type + '-' + category).classList.add('active');
      });
    });

    // Copy Code
    function copyCode(button) {
      const codeBlock = button.parentElement;
      const code = codeBlock.querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = "${T('btn_copied_text')}";
        setTimeout(() => {
          button.textContent = "${T('btn_copy')}";
        }, 2000);
      });
    }

    // Like Skill
    async function likeSkill(skillId, button) {
      try {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: skillId })
        });
        const data = await res.json();
        if (res.ok) {
          button.classList.add('liked');
          button.querySelector('.like-count').textContent = data.count;
        } else {
          alert(data.error || '${T('alert_like_limit')}');
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Toggle Comments
    async function toggleComments(skillId, button) {
      const commentsDiv = document.getElementById('comments-' + skillId);
      const isActive = commentsDiv.classList.contains('active');
      
      if (isActive) {
        commentsDiv.classList.remove('active');
        return;
      }
      
      commentsDiv.classList.add('active');
      
      // Load comments
      try {
        const res = await fetch('/api/comments?card_id=' + skillId);
        const comments = await res.json();
        const listDiv = document.getElementById('comment-list-' + skillId);
        
        if (comments.length === 0) {
          listDiv.innerHTML = '<div style="color:#999; font-size:12px; text-align:center;">${T('no_comments')}</div>';
        } else {
          listDiv.innerHTML = comments.map(c => \`
            <div class="skill-comment-item">
              <div class="skill-comment-header">
                <span>\${c.nickname || 'Anonymous'}</span>
                <span>\${new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div>\${c.content}</div>
            </div>
          \`).join('');
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Submit Comment
    async function submitComment(skillId) {
      const input = document.getElementById('comment-input-' + skillId);
      const content = input.value.trim();
      if (!content) return;
      
      const nickname = localStorage.getItem('nickname') || 'Anonymous';
      
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: skillId, nickname, content })
        });
        
        if (res.ok) {
          input.value = '';
          // Refresh comments
          toggleComments(skillId, null);
          setTimeout(() => toggleComments(skillId, null), 100);
          // Update count
          const countSpan = document.querySelector('[data-skill-id="' + skillId + '"] .comment-count');
          if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
          }
        } else {
          const data = await res.json();
          alert(data.error || '${T('alert_comment_limit')}');
        }
      } catch (err) {
        console.error(err);
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, {
        headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
}
