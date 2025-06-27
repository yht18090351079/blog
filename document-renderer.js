// 文档渲染器
class DocumentRenderer {
    constructor() {
        this.blockTypeMap = {
            1: 'page',
            2: 'text',
            3: 'heading1',
            4: 'heading2',
            5: 'heading3',
            6: 'heading4',
            7: 'heading5',
            8: 'heading6',
            9: 'heading7',
            10: 'heading8',
            11: 'heading9',
            12: 'bullet',
            13: 'ordered',
            14: 'code',
            15: 'quote',
            17: 'todo',
            18: 'bitable',
            19: 'callout',
            20: 'chat_card',
            21: 'diagram',
            22: 'divider',
            23: 'file',
            24: 'grid',
            25: 'grid_column',
            26: 'iframe',
            27: 'image',
            28: 'isv',
            29: 'mindnote',
            30: 'sheet',
            31: 'table',
            32: 'table_cell',
            33: 'view',
            34: 'quote_container',
            35: 'task',
            36: 'okr',
            37: 'okr_objective',
            38: 'okr_key_result',
            39: 'okr_progress',
            40: 'add_ons',
            41: 'jira_issue',
            42: 'wiki_catalog',
            43: 'board',
            44: 'agenda',
            45: 'agenda_item',
            46: 'agenda_item_title',
            47: 'agenda_item_content',
            48: 'link_preview',
            999: 'undefined'
        };
    }

    // 渲染完整文档
    async renderDocument(blocks, documentId) {
        const container = document.createElement('div');
        container.className = 'document-container';

        // 创建块映射表
        const blockMap = {};
        blocks.forEach(block => {
            blockMap[block.block_id] = block;
        });

        // 找到根节点（页面块）
        const rootBlock = blocks.find(block => block.block_type === 1);
        if (!rootBlock) {
            container.innerHTML = '<p>未找到文档根节点</p>';
            return container;
        }

        // 递归渲染子块
        await this.renderChildBlocks(rootBlock.children || [], blockMap, container, documentId);

        return container;
    }

    // 递归渲染子块
    async renderChildBlocks(childIds, blockMap, container, documentId) {
        for (const childId of childIds) {
            const block = blockMap[childId];
            if (block) {
                const blockElement = await this.renderBlock(block, blockMap, documentId);
                if (blockElement) {
                    container.appendChild(blockElement);
                }
            }
        }
    }

    // 渲染单个块
    async renderBlock(block, blockMap, documentId) {
        const blockType = this.blockTypeMap[block.block_type];
        const element = document.createElement('div');
        element.className = `block block-${blockType}`;
        element.setAttribute('data-block-id', block.block_id);

        try {
            switch (blockType) {
                case 'text':
                    await this.renderTextBlock(block, element);
                    break;
                case 'heading1':
                case 'heading2':
                case 'heading3':
                case 'heading4':
                case 'heading5':
                case 'heading6':
                case 'heading7':
                case 'heading8':
                case 'heading9':
                    await this.renderHeadingBlock(block, element, blockType);
                    break;
                case 'quote':
                    await this.renderQuoteBlock(block, element);
                    break;
                case 'bullet':
                    await this.renderBulletBlock(block, element);
                    break;
                case 'ordered':
                    await this.renderOrderedBlock(block, element);
                    break;
                case 'todo':
                    await this.renderTodoBlock(block, element);
                    break;
                case 'bitable':
                    await this.renderBitableBlock(block, element);
                    break;
                case 'sheet':
                    await this.renderSheetBlock(block, element);
                    break;
                case 'callout':
                    await this.renderCalloutBlock(block, blockMap, element, documentId);
                    break;
                case 'table':
                    await this.renderTableBlock(block, blockMap, element, documentId);
                    break;
                case 'table_cell':
                    await this.renderTableCellBlock(block, blockMap, element, documentId);
                    break;
                case 'image':
                    await this.renderImageBlock(block, element, documentId);
                    break;
                case 'iframe':
                    await this.renderIframeBlock(block, element);
                    break;
                case 'grid':
                    await this.renderGridBlock(block, blockMap, element, documentId);
                    break;
                case 'grid_column':
                    await this.renderGridColumnBlock(block, blockMap, element, documentId);
                    break;
                case 'quote_container':
                    await this.renderQuoteContainerBlock(block, blockMap, element, documentId);
                    break;
                case 'divider':
                    element.innerHTML = '<hr style="margin: 2rem 0; border: none; border-top: 1px solid #e1e8ed;">';
                    break;
                case 'undefined':
                    // 处理999类型的未定义块，可能是多维表格或其他特殊内容
                    await this.renderUndefinedBlock(block, blockMap, element, documentId);
                    break;
                default:
                    // 对于其他类型的块，尝试渲染子块
                    if (block.children && block.children.length > 0) {
                        await this.renderChildBlocks(block.children, blockMap, element, documentId);
                    } else {
                        // 如果是不支持的块类型且没有子块，显示提示信息
                        element.innerHTML = `<div style="color: #666; font-style: italic;">不支持的内容类型: ${blockType}</div>`;
                    }
                    break;
            }

            return element;
        } catch (error) {
            console.error('渲染块失败:', error, block);
            element.innerHTML = `<div style="color: #f56565;">渲染错误: ${error.message}</div>`;
            return element;
        }
    }

    // 渲染文本块
    async renderTextBlock(block, element) {
        const textData = block.text || block.heading1 || block.heading2 || block.heading3 ||
            block.heading4 || block.heading5 || block.heading6 ||
            block.heading7 || block.heading8 || block.heading9;

        if (textData && textData.elements) {
            const content = await this.renderTextElements(textData.elements);
            const alignClass = this.getAlignClass(textData.style?.align);
            element.className += ` ${alignClass}`;
            element.innerHTML = content;
        }
    }

    // 渲染标题块
    async renderHeadingBlock(block, element, blockType) {
        const headingData = block[blockType];
        if (headingData && headingData.elements) {
            const content = await this.renderTextElements(headingData.elements);
            const alignClass = this.getAlignClass(headingData.style?.align);
            element.className += ` ${alignClass}`;

            // 生成标题ID用于锚点跳转
            const headingText = this.extractTextFromElements(headingData.elements);
            const headingId = this.generateHeadingId(headingText, block.block_id);
            element.id = headingId;

            // 添加标题级别数据属性
            const level = parseInt(blockType.replace('heading', ''));
            element.setAttribute('data-heading-level', level);
            element.setAttribute('data-heading-text', headingText);

            element.innerHTML = content;
        }
    }

    // 渲染引用块
    async renderQuoteBlock(block, element) {
        const quoteData = block.quote;
        if (quoteData && quoteData.elements) {
            const content = await this.renderTextElements(quoteData.elements);
            element.innerHTML = content;
        }
    }

    // 渲染项目符号块
    async renderBulletBlock(block, element) {
        const bulletData = block.bullet;
        if (bulletData && bulletData.elements) {
            const content = await this.renderTextElements(bulletData.elements);
            const alignClass = this.getAlignClass(bulletData.style?.align);
            element.className += ` ${alignClass}`;

            // 创建项目符号列表项
            const listItem = document.createElement('li');
            listItem.innerHTML = content;

            // 创建无序列表容器
            const ul = document.createElement('ul');
            ul.appendChild(listItem);

            element.appendChild(ul);
        }
    }

    // 渲染有序列表块
    async renderOrderedBlock(block, element) {
        const orderedData = block.ordered;
        if (orderedData && orderedData.elements) {
            const content = await this.renderTextElements(orderedData.elements);
            const alignClass = this.getAlignClass(orderedData.style?.align);
            element.className += ` ${alignClass}`;

            // 创建有序列表项
            const listItem = document.createElement('li');
            listItem.innerHTML = content;

            // 创建有序列表容器
            const ol = document.createElement('ol');
            ol.appendChild(listItem);

            element.appendChild(ol);
        }
    }

    // 渲染待办事项块
    async renderTodoBlock(block, element) {
        const todoData = block.todo;
        if (todoData) {
            console.log('渲染待办事项:', {
                block_id: block.block_id,
                done: todoData.style?.done,
                elements: todoData.elements ? todoData.elements.length : 0,
                style: todoData.style
            });

            // 创建待办事项容器
            const todoContainer = document.createElement('div');
            todoContainer.className = 'todo-item';

            // 创建复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todoData.style?.done || false;

            // 添加点击事件处理
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                if (isChecked) {
                    contentContainer.classList.add('todo-completed');
                } else {
                    contentContainer.classList.remove('todo-completed');
                }
                console.log(`待办事项 ${block.block_id} 状态变更为: ${isChecked ? '已完成' : '未完成'}`);
            });

            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'todo-content';

            // 如果任务已完成，添加完成样式
            if (todoData.style?.done) {
                contentContainer.classList.add('todo-completed');
            }

            // 渲染待办事项文本内容
            if (todoData.elements && todoData.elements.length > 0) {
                const content = await this.renderTextElements(todoData.elements);
                contentContainer.innerHTML = content;
            } else {
                contentContainer.innerHTML = '<span style="color: #666; font-style: italic;">空待办事项</span>';
            }

            todoContainer.appendChild(checkbox);
            todoContainer.appendChild(contentContainer);
            element.appendChild(todoContainer);

        } else {
            console.error('待办事项数据结构不正确:', block);
            element.innerHTML = '<div style="color: #f56565;">待办事项数据错误</div>';
        }
    }

    // 渲染多维表格块
    async renderBitableBlock(block, element) {
        const bitableData = block.bitable;
        if (bitableData && bitableData.token) {
            console.log('渲染多维表格:', {
                block_id: block.block_id,
                token: bitableData.token,
                view_type: bitableData.view_type
            });

            // 创建加载提示
            element.innerHTML = '<div class="bitable-loading">📊 正在加载多维表格数据...</div>';

            try {
                // 解析token获取app_token和table_id
                const { app_token, table_id } = feishuAPI.parseBitableToken(bitableData.token);
                console.log('解析多维表格token:', { app_token, table_id });

                // 获取多维表格基本信息
                const bitableInfo = await feishuAPI.getBitableInfo(app_token);
                console.log('多维表格信息:', bitableInfo);

                // 获取数据表列表
                const tablesData = await feishuAPI.getBitableTables(app_token);
                const tables = tablesData.items || [];
                console.log('数据表列表:', tables);

                // 找到当前数据表
                let currentTable = null;
                if (table_id) {
                    currentTable = tables.find(table => table.table_id === table_id);
                } else if (tables.length > 0) {
                    currentTable = tables[0]; // 使用第一个表
                }

                if (!currentTable) {
                    throw new Error('未找到指定的数据表');
                }

                console.log('当前数据表:', currentTable);

                // 获取字段和记录数据
                const [fieldsData, recordsData] = await Promise.all([
                    feishuAPI.getBitableFields(app_token, currentTable.table_id),
                    feishuAPI.getBitableRecords(app_token, currentTable.table_id)
                ]);

                const fields = fieldsData.items || [];
                const records = recordsData.items || [];

                console.log('字段数据:', fields);
                console.log('记录数据:', records);

                // 渲染多维表格
                await this.renderBitableContent(element, {
                    bitableInfo,
                    currentTable,
                    tables,
                    fields,
                    records
                });

            } catch (error) {
                console.error('获取多维表格数据失败:', error);
                element.innerHTML = `
                    <div class="bitable-error">
                        <div class="bitable-title">📊 多维表格</div>
                        <div class="bitable-error-message">
                            ❌ 无法加载多维表格数据：${error.message}
                        </div>
                        <div class="bitable-token">Token: ${bitableData.token}</div>
                        <div class="bitable-note">
                            请检查：<br>
                            1. Token是否正确<br>
                            2. 是否有访问权限<br>
                            3. 网络连接是否正常
                        </div>
                    </div>
                `;
            }
        } else {
            console.error('多维表格数据结构不正确:', block);
            element.innerHTML = '<div style="color: #f56565;">多维表格数据错误</div>';
        }
    }

    // 渲染飞书电子表格块
    async renderSheetBlock(block, element) {
        const sheetData = block.sheet;
        if (sheetData && sheetData.token) {
            console.log('渲染飞书电子表格:', {
                block_id: block.block_id,
                token: sheetData.token
            });

            // 显示加载状态
            element.innerHTML = '<div class="sheet-loading">📊 正在加载电子表格信息...</div>';

            try {
                // 获取电子表格基础信息
                const spreadsheetInfo = await feishuAPI.getSpreadsheetInfo(sheetData.token);
                console.log('电子表格信息:', spreadsheetInfo);

                // 获取工作表列表
                const sheetsData = await feishuAPI.getSpreadsheetSheets(sheetData.token);
                const sheets = sheetsData.sheets || [];
                console.log('工作表列表:', sheets);

                // 渲染电子表格内容
                await this.renderSpreadsheetContent(element, {
                    spreadsheetInfo: spreadsheetInfo.spreadsheet,
                    sheets: sheets,
                    token: sheetData.token
                });

            } catch (error) {
                console.error('渲染飞书电子表格失败:', error);

                // 提供降级方案 - 显示基本信息但不调用API
                this.renderSpreadsheetFallback(element, sheetData.token, error.message);
            }
        } else {
            console.error('飞书电子表格数据不完整:', block);
            element.innerHTML = '<div class="sheet-error">飞书电子表格数据错误</div>';
        }
    }

    // 渲染电子表格内容
    async renderSpreadsheetContent(element, data) {
        const { spreadsheetInfo, sheets, token } = data;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'sheet-container';

        // 创建标题区域
        const header = document.createElement('div');
        header.className = 'sheet-header';

        const title = document.createElement('div');
        title.className = 'sheet-title';
        title.innerHTML = `📊 ${spreadsheetInfo.title || '电子表格'}`;

        const meta = document.createElement('div');
        meta.className = 'sheet-meta';

        // 表格基本信息
        const infoSpan = document.createElement('span');
        infoSpan.className = 'sheet-info';
        infoSpan.innerHTML = `${sheets.length} 个工作表`;

        // 打开链接按钮
        const openButton = document.createElement('a');
        openButton.className = 'sheet-open-btn';
        openButton.href = spreadsheetInfo.url || `https://bytedance.feishu.cn/sheets/${token}`;
        openButton.target = '_blank';
        openButton.textContent = '在飞书中打开';

        meta.appendChild(infoSpan);
        meta.appendChild(openButton);
        header.appendChild(title);
        header.appendChild(meta);

        // 工作表列表
        if (sheets.length > 0) {
            const sheetsContainer = document.createElement('div');
            sheetsContainer.className = 'sheet-sheets-list';

            const sheetsTitle = document.createElement('div');
            sheetsTitle.className = 'sheet-sheets-title';
            sheetsTitle.textContent = '工作表：';

            const sheetsList = document.createElement('div');
            sheetsList.className = 'sheet-sheets';

            sheets.forEach(sheet => {
                const sheetItem = document.createElement('span');
                sheetItem.className = 'sheet-item';
                sheetItem.textContent = sheet.title;
                sheetsList.appendChild(sheetItem);
            });

            sheetsContainer.appendChild(sheetsTitle);
            sheetsContainer.appendChild(sheetsList);
            header.appendChild(sheetsContainer);
        }

        container.appendChild(header);

        // 创建内容区域
        const contentArea = document.createElement('div');
        contentArea.className = 'sheet-content';
        contentArea.innerHTML = `
            <div class="sheet-note">
                <p>🔗 这是一个飞书电子表格</p>
                <p>标题：${spreadsheetInfo.title || '未命名表格'}</p>
                ${spreadsheetInfo.owner_id ? `<p>所有者：${spreadsheetInfo.owner_id}</p>` : ''}
                <p>点击上方"在飞书中打开"按钮查看完整内容</p>
            </div>
        `;

        container.appendChild(contentArea);

        element.innerHTML = '';
        element.appendChild(container);
    }

    // 电子表格降级渲染（当API调用失败时使用）
    renderSpreadsheetFallback(element, token, errorMessage) {
        const container = document.createElement('div');
        container.className = 'sheet-container';

        // 创建头部
        const header = document.createElement('div');
        header.className = 'sheet-header';

        const title = document.createElement('div');
        title.className = 'sheet-title';
        title.innerHTML = '📊 飞书电子表格';

        const meta = document.createElement('div');
        meta.className = 'sheet-meta';

        // 表格ID信息
        const tokenInfo = document.createElement('span');
        tokenInfo.className = 'sheet-token';
        tokenInfo.textContent = `ID: ${token}`;

        // 打开链接按钮
        const openButton = document.createElement('a');
        openButton.className = 'sheet-open-btn';
        openButton.href = `https://bytedance.feishu.cn/sheets/${token}`;
        openButton.target = '_blank';
        openButton.textContent = '在飞书中打开';

        meta.appendChild(tokenInfo);
        meta.appendChild(openButton);
        header.appendChild(title);
        header.appendChild(meta);
        container.appendChild(header);

        // 创建内容区域
        const contentArea = document.createElement('div');
        contentArea.className = 'sheet-content';

        // 显示警告信息
        const warningDiv = document.createElement('div');
        warningDiv.className = 'sheet-warning';
        warningDiv.innerHTML = `
            <div class="sheet-warning-title">⚠️ 无法获取详细信息</div>
            <div class="sheet-warning-message">
                ${this.getErrorDisplayMessage(errorMessage)}
            </div>
            <div class="sheet-warning-suggestions">
                <strong>建议：</strong><br>
                • 点击上方"在飞书中打开"按钮直接访问<br>
                • 检查是否有该表格的访问权限<br>
                • 确认表格ID是否正确
            </div>
        `;

        contentArea.appendChild(warningDiv);
        container.appendChild(contentArea);

        element.innerHTML = '';
        element.appendChild(container);
    }

    // 获取用户友好的错误信息
    getErrorDisplayMessage(errorMessage) {
        if (errorMessage.includes('Path param :spreadsheet_token invalid')) {
            return '表格ID无效或您没有访问权限';
        } else if (errorMessage.includes('403')) {
            return '没有访问权限';
        } else if (errorMessage.includes('404')) {
            return '表格不存在或已被删除';
        } else if (errorMessage.includes('网络')) {
            return '网络连接失败';
        } else {
            return `加载失败：${errorMessage}`;
        }
    }

    // 渲染多维表格内容
    async renderBitableContent(element, data) {
        const { bitableInfo, currentTable, tables, fields, records } = data;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'bitable-container';

        // 创建标题区域
        const header = document.createElement('div');
        header.className = 'bitable-header';
        header.innerHTML = `
            <div class="bitable-title">
                📊 ${bitableInfo.name || '多维表格'}
                ${currentTable.name ? `- ${currentTable.name}` : ''}
            </div>
            <div class="bitable-meta">
                <span class="bitable-record-count">共 ${records.length} 条记录</span>
                <span class="bitable-field-count">${fields.length} 个字段</span>
            </div>
        `;

        // 创建数据表选择器（如果有多个表）
        if (tables.length > 1) {
            const tableSelector = document.createElement('div');
            tableSelector.className = 'bitable-table-selector';
            tableSelector.innerHTML = `
                <label>数据表: </label>
                <select class="table-select">
                    ${tables.map(table =>
                `<option value="${table.table_id}" ${table.table_id === currentTable.table_id ? 'selected' : ''}>
                            ${table.name}
                        </option>`
            ).join('')}
                </select>
            `;
            header.appendChild(tableSelector);
        }

        // 创建表格
        const tableContainer = document.createElement('div');
        tableContainer.className = 'bitable-table-container';

        if (fields.length === 0 || records.length === 0) {
            tableContainer.innerHTML = '<div class="bitable-empty">暂无数据</div>';
        } else {
            const table = this.createBitableTable(fields, records);
            tableContainer.appendChild(table);
        }

        container.appendChild(header);
        container.appendChild(tableContainer);

        element.innerHTML = '';
        element.appendChild(container);
    }

    // 创建多维表格HTML表格
    createBitableTable(fields, records) {
        const table = document.createElement('table');
        table.className = 'bitable-table';

        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        fields.forEach(field => {
            const th = document.createElement('th');
            th.className = `field-type-${field.type}`;
            th.innerHTML = `
                <div class="field-header">
                    <span class="field-name">${field.field_name}</span>
                    <span class="field-type">${this.getFieldTypeDisplay(field)}</span>
                </div>
            `;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 创建表体
        const tbody = document.createElement('tbody');

        records.forEach((record, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'even' : 'odd';

            fields.forEach(field => {
                const td = document.createElement('td');
                td.className = `field-type-${field.type}`;

                const fieldValue = record.fields[field.field_name];
                td.innerHTML = this.renderFieldValue(field, fieldValue);

                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        return table;
    }

    // 获取字段类型显示名称
    getFieldTypeDisplay(field) {
        const typeMap = {
            1: field.ui_type === 'Barcode' ? '条码' : field.ui_type === 'Email' ? '邮箱' : '文本',
            2: field.ui_type === 'Progress' ? '进度' : field.ui_type === 'Currency' ? '货币' : field.ui_type === 'Rating' ? '评分' : '数字',
            3: '单选',
            4: '多选',
            5: '日期',
            7: '复选框',
            11: '人员',
            13: '电话',
            15: '链接',
            17: '附件',
            18: '单向关联',
            19: '查找引用',
            20: '公式',
            21: '双向关联',
            22: '地理位置',
            23: '群组',
            1001: '创建时间',
            1002: '更新时间',
            1003: '创建人',
            1004: '修改人',
            1005: '自动编号'
        };
        return typeMap[field.type] || '未知';
    }

    // 渲染字段值
    renderFieldValue(field, value) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return '<span class="empty-value">-</span>';
        }

        // 首先检查字段名称，如果是状态/进度相关字段，且是数值，则显示为进度条
        if (field.field_name && (field.field_name.includes('状态') || field.field_name.includes('进度') || field.field_name.includes('完成'))) {
            const numValue = this.extractNumericValue(value);
            if (numValue !== null) {
                const percentage = numValue <= 1 ? (numValue * 100).toFixed(0) : numValue.toFixed(0);
                return `<div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%">${percentage}%</div></div>`;
            }
        }

        switch (field.type) {
            case 1: // 文本/邮箱/条码
                return this.renderTextValue(field, value);
            case 2: // 数字/进度/货币/评分
                return this.renderNumberValue(field, value);
            case 3: // 单选
                return this.renderSingleSelectValue(value);
            case 4: // 多选
                return this.renderMultiSelectValue(value);
            case 5: // 日期
                return this.renderDateValue(value);
            case 7: // 复选框
                return this.renderCheckboxValue(value);
            case 11: // 人员
                return this.renderUserValue(value);
            case 13: // 电话
                return this.renderPhoneValue(value);
            case 15: // 链接
                return this.renderUrlValue(value);
            case 17: // 附件
                return this.renderAttachmentValue(value);
            default:
                return this.renderDefaultValue(value, field);
        }
    }

    // 渲染文本值
    renderTextValue(field, value) {
        if (Array.isArray(value) && value.length > 0) {
            const textValue = value[0].text || '';
            if (field.ui_type === 'Email') {
                return `<a href="mailto:${textValue}" class="email-link">${textValue}</a>`;
            }
            // 显示完整文本内容，不截断
            return `<div class="text-content">${this.escapeHtml(textValue)}</div>`;
        }
        return `<div class="text-content">${this.escapeHtml(String(value))}</div>`;
    }

    // 渲染数字值
    renderNumberValue(field, value) {
        if (Array.isArray(value) && value.length > 0) {
            const numValue = value[0];
            if (field.ui_type === 'Progress') {
                return `<div class="progress-bar"><div class="progress-fill" style="width: ${numValue * 100}%">${(numValue * 100).toFixed(0)}%</div></div>`;
            } else if (field.ui_type === 'Currency') {
                return `<span class="currency-value">¥${numValue}</span>`;
            } else if (field.ui_type === 'Rating') {
                const stars = '★'.repeat(Math.floor(numValue)) + '☆'.repeat(5 - Math.floor(numValue));
                return `<span class="rating-value">${stars}</span>`;
            }
            // 检查字段名称是否表示进度/状态，如果是则显示为进度条
            if (field.field_name && (field.field_name.includes('状态') || field.field_name.includes('进度') || field.field_name.includes('完成'))) {
                const percentage = (numValue * 100).toFixed(0);
                return `<div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%">${percentage}%</div></div>`;
            }
            return numValue;
        }
        return value;
    }

    // 渲染单选值
    renderSingleSelectValue(value) {
        if (Array.isArray(value) && value.length > 0) {
            return `<span class="select-option single">${value[0]}</span>`;
        }
        return value;
    }

    // 渲染多选值
    renderMultiSelectValue(value) {
        if (Array.isArray(value)) {
            return value.map(item => `<span class="select-option multi">${item}</span>`).join('');
        }
        return value;
    }

    // 渲染日期值
    renderDateValue(value) {
        if (Array.isArray(value) && value.length > 0) {
            const timestamp = value[0];
            const date = new Date(timestamp);
            return `<span class="date-value">${date.toLocaleDateString('zh-CN')}</span>`;
        }
        // 如果是数字格式的时间戳，尝试转换
        if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
            const timestamp = parseInt(value);
            // 检查是否是毫秒时间戳（13位数字）或秒时间戳（10位数字）
            const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
            if (!isNaN(date.getTime())) {
                return `<span class="date-value">${date.toLocaleDateString('zh-CN')}</span>`;
            }
        }
        return value;
    }

    // 渲染复选框值
    renderCheckboxValue(value) {
        const checked = Array.isArray(value) ? value[0] : value;
        return `<span class="checkbox-value">${checked ? '✅' : '❌'}</span>`;
    }

    // 渲染用户值
    renderUserValue(value) {
        if (Array.isArray(value)) {
            return value.map(user => `<span class="user-mention">@${user.name || user.id}</span>`).join(' ');
        }
        return value;
    }

    // 渲染电话值
    renderPhoneValue(value) {
        if (Array.isArray(value) && value.length > 0) {
            const phone = value[0];
            return `<a href="tel:${phone}" class="phone-link">${phone}</a>`;
        }
        return value;
    }

    // 渲染链接值
    renderUrlValue(value) {
        if (Array.isArray(value) && value.length > 0) {
            const url = value[0].link || value[0];
            const text = value[0].text || url;
            return `<a href="${url}" target="_blank" class="url-link">${text}</a>`;
        }
        return value;
    }

    // 渲染附件值
    renderAttachmentValue(value) {
        if (Array.isArray(value)) {
            return value.map(file => `<span class="attachment-file">📎 ${file.name || '附件'}</span>`).join(' ');
        }
        return '📎 附件';
    }

    // 提取数值
    extractNumericValue(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (Array.isArray(value) && value.length > 0) {
            const firstValue = value[0];
            if (typeof firstValue === 'number') {
                return firstValue;
            }
            if (typeof firstValue === 'string') {
                const num = parseFloat(firstValue);
                return isNaN(num) ? null : num;
            }
        }
        if (typeof value === 'string') {
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        }
        return null;
    }

    // 渲染默认值
    renderDefaultValue(value, field = null) {
        // 检查是否是时间字段
        if (field && field.field_name && (field.field_name.includes('时间') || field.field_name.includes('日期'))) {
            return this.renderDateValue(value);
        }

        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object') {
                    return item.text || JSON.stringify(item);
                }
                return String(item);
            }).join(', ');
        }

        // 如果看起来像时间戳，尝试转换
        if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,13}$/.test(value))) {
            const timestamp = parseInt(value);
            const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1970 && date.getFullYear() < 2100) {
                return `<span class="date-value">${date.toLocaleDateString('zh-CN')}</span>`;
            }
        }

        return this.escapeHtml(String(value));
    }

    // 渲染高亮块
    async renderCalloutBlock(block, blockMap, element, documentId) {
        const calloutData = block.callout;
        if (calloutData) {
            console.log('渲染高亮块:', {
                block_id: block.block_id,
                emoji_id: calloutData.emoji_id,
                background_color: calloutData.background_color,
                border_color: calloutData.border_color,
                children: block.children ? block.children.length : 0
            });

            const emoji = getEmoji(calloutData.emoji_id);
            const bgColorClass = calloutData.background_color ? `callout-bg-${calloutData.background_color}` : '';
            const borderColorClass = calloutData.border_color ? `callout-border-${calloutData.border_color}` : '';

            element.className += ` ${bgColorClass} ${borderColorClass}`;

            const emojiElement = document.createElement('div');
            emojiElement.className = 'callout-emoji';
            emojiElement.textContent = emoji;

            const contentElement = document.createElement('div');
            contentElement.className = 'callout-content';

            element.appendChild(emojiElement);
            element.appendChild(contentElement);

            // 渲染子块内容
            if (block.children && block.children.length > 0) {
                await this.renderChildBlocks(block.children, blockMap, contentElement, documentId);
            } else {
                contentElement.innerHTML = '<div style="color: #666; font-style: italic;">高亮块内容为空</div>';
            }
        } else {
            console.error('高亮块数据结构不正确:', block);
            element.innerHTML = '<div style="color: #f56565;">高亮块数据错误</div>';
        }
    }

    // 渲染表格块
    async renderTableBlock(block, blockMap, element, documentId) {
        const tableData = block.table;
        if (tableData && tableData.property) {
            const table = document.createElement('table');
            table.className = 'table';

            const { cells, property } = tableData;
            const { row_size, column_size, header_row, header_column, merge_info } = property;

            console.log('渲染表格:', {
                row_size,
                column_size,
                cells: cells ? cells.length : 0,
                children: block.children ? block.children.length : 0,
                header_row,
                header_column,
                有单元格数据: !!cells,
                块结构: {
                    block_id: block.block_id,
                    block_type: block.block_type,
                    has_table_data: !!block.table
                }
            });

            // 使用cells数组或children数组，以有效的为准
            const cellIds = cells || block.children || [];

            if (cellIds.length === 0) {
                element.innerHTML = '<div style="color: #666; font-style: italic;">表格数据为空</div>';
                return;
            }

            if (cellIds.length !== row_size * column_size) {
                console.warn(`表格单元格数量不匹配: 期望 ${row_size * column_size}, 实际 ${cellIds.length}`);
            }

            // 创建表格行
            for (let row = 0; row < row_size; row++) {
                const tr = document.createElement('tr');

                for (let col = 0; col < column_size; col++) {
                    const cellIndex = row * column_size + col;
                    const cellId = cellIds[cellIndex];
                    const cellBlock = blockMap[cellId];

                    // 判断是否为表头
                    const isHeaderCell = (header_row && row === 0) || (header_column && col === 0);
                    const td = document.createElement(isHeaderCell ? 'th' : 'td');

                    if (cellBlock) {
                        console.log(`单元格 [${row}, ${col}] ID: ${cellId}`, cellBlock);

                        // 确保单元格块是 table_cell 类型
                        if (cellBlock.block_type === 32 && cellBlock.table_cell !== undefined) {
                            if (cellBlock.children && cellBlock.children.length > 0) {
                                // 渲染单元格子块
                                await this.renderChildBlocks(cellBlock.children, blockMap, td, documentId);
                            } else {
                                // 如果没有子块，显示空内容
                                td.innerHTML = '&nbsp;';
                            }
                        } else {
                            console.warn(`单元格块类型不匹配: ${cellBlock.block_type}, 期望: 32`);
                            td.innerHTML = '<span style="color: #999; font-style: italic;">无效的单元格块</span>';
                        }
                    } else {
                        // 如果找不到单元格块，显示错误
                        td.innerHTML = '<span style="color: #999; font-style: italic;">单元格加载失败</span>';
                        console.warn('找不到单元格块:', cellId);
                    }

                    // 处理单元格合并信息
                    if (merge_info && merge_info[cellIndex]) {
                        const mergeInfo = merge_info[cellIndex];
                        if (mergeInfo.row_span > 1) {
                            td.setAttribute('rowspan', mergeInfo.row_span);
                        }
                        if (mergeInfo.col_span > 1) {
                            td.setAttribute('colspan', mergeInfo.col_span);
                        }
                    }

                    tr.appendChild(td);
                }

                table.appendChild(tr);
            }

            element.appendChild(table);
        } else {
            console.error('表格数据结构不正确:', tableData);
            element.innerHTML = '<div style="color: #f56565;">表格数据结构错误</div>';
        }
    }

    // 渲染表格单元格块
    async renderTableCellBlock(block, blockMap, element, documentId) {
        // 表格单元格的内容在其子块中
        // 注意：此方法通常不会被直接调用，因为单元格会在表格渲染时处理
        console.log('独立渲染表格单元格块:', block);

        if (block.table_cell !== undefined) {
            if (block.children && block.children.length > 0) {
                await this.renderChildBlocks(block.children, blockMap, element, documentId);
            } else {
                element.innerHTML = '<div style="color: #666; font-style: italic; padding: 0.5rem;">空单元格</div>';
            }
        } else {
            element.innerHTML = '<div style="color: #f56565;">无效的单元格块</div>';
        }
    }

    // 渲染图片块
    async renderImageBlock(block, element, documentId) {
        const imageData = block.image;
        if (imageData && imageData.token) {
            const img = document.createElement('img');
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.alt = '图片';

            // 设置对齐方式
            const alignClass = this.getImageAlignClass(imageData.align);
            element.className += ` ${alignClass}`;

            try {
                const imageUrl = await feishuAPI.getImageUrl(imageData.token);
                if (imageUrl) {
                    img.src = imageUrl;
                } else {
                    img.alt = '图片加载失败';
                    img.style.display = 'none';
                    element.innerHTML = '<div style="color: #666; font-style: italic;">图片加载失败</div>';
                }
            } catch (error) {
                console.error('加载图片失败:', error);
                element.innerHTML = '<div style="color: #666; font-style: italic;">图片加载失败</div>';
            }

            element.appendChild(img);
        }
    }

    // 渲染内嵌块
    async renderIframeBlock(block, element) {
        const iframeData = block.iframe;
        if (iframeData && iframeData.component) {
            const iframe = document.createElement('iframe');
            iframe.src = decodeURIComponent(iframeData.component.url);
            iframe.style.width = '100%';
            iframe.style.height = '400px';
            iframe.style.border = '1px solid #e1e8ed';
            iframe.style.borderRadius = '8px';

            element.appendChild(iframe);
        }
    }

    // 渲染分栏块
    async renderGridBlock(block, blockMap, element, documentId) {
        const gridData = block.grid;
        if (gridData && block.children) {
            element.style.display = 'flex';
            element.style.gap = '1rem';
            element.style.margin = '1rem 0';

            await this.renderChildBlocks(block.children, blockMap, element, documentId);
        }
    }

    // 渲染分栏列块
    async renderGridColumnBlock(block, blockMap, element, documentId) {
        const columnData = block.grid_column;
        if (columnData) {
            element.style.flex = '1';
            element.style.padding = '1rem';
            element.style.backgroundColor = '#f8f9fa';
            element.style.borderRadius = '8px';

            if (block.children) {
                await this.renderChildBlocks(block.children, blockMap, element, documentId);
            }
        }
    }

    // 渲染引用容器块
    async renderQuoteContainerBlock(block, blockMap, element, documentId) {
        element.style.background = '#f8f9fa';
        element.style.borderLeft = '4px solid #4285f4';
        element.style.padding = '1rem';
        element.style.margin = '1rem 0';
        element.style.borderRadius = '0 4px 4px 0';

        if (block.children) {
            await this.renderChildBlocks(block.children, blockMap, element, documentId);
        }
    }

    // 渲染未定义类型的块（999类型）
    async renderUndefinedBlock(block, blockMap, element, documentId) {
        console.log('渲染未定义块:', {
            block_id: block.block_id,
            block_type: block.block_type,
            data: block
        });

        // 检查是否有undefined属性
        if (block.undefined !== undefined) {
            // 根据undefined内容判断具体类型
            console.log('undefined属性:', block.undefined);

            // 如果undefined是空对象，可能是多维表格或其他嵌入内容
            if (Object.keys(block.undefined).length === 0) {
                // 尝试检查是否有token信息（可能是多维表格）
                element.innerHTML = `
                    <div class="undefined-block">
                        <div class="undefined-header">
                            <span class="undefined-icon">🔗</span>
                            <span class="undefined-title">嵌入内容</span>
                        </div>
                        <div class="undefined-content">
                            <p>检测到嵌入的内容块（类型：${block.block_type}），可能是：</p>
                            <ul>
                                <li>多维表格</li>
                                <li>外部链接</li>
                                <li>嵌入式应用</li>
                                <li>其他飞书应用内容</li>
                            </ul>
                            <p class="undefined-note">💡 请在飞书应用中查看完整内容</p>
                        </div>
                    </div>
                `;
            } else {
                // 如果undefined有其他属性，尝试渲染这些属性
                const undefinedContent = JSON.stringify(block.undefined, null, 2);
                element.innerHTML = `
                    <div class="undefined-block">
                        <div class="undefined-header">
                            <span class="undefined-icon">⚠️</span>
                            <span class="undefined-title">未知内容块</span>
                        </div>
                        <div class="undefined-content">
                            <pre class="undefined-data">${this.escapeHtml(undefinedContent)}</pre>
                        </div>
                    </div>
                `;
            }
        } else {
            // 如果没有undefined属性，显示通用信息
            element.innerHTML = `
                <div class="undefined-block">
                    <div class="undefined-header">
                        <span class="undefined-icon">❓</span>
                        <span class="undefined-title">未识别内容</span>
                    </div>
                    <div class="undefined-content">
                        <p>无法识别的内容块类型：${block.block_type}</p>
                    </div>
                </div>
            `;
        }

        // 递归渲染子块
        if (block.children && block.children.length > 0) {
            await this.renderChildBlocks(block.children, blockMap, element, documentId);
        }
    }

    // 渲染文本元素
    async renderTextElements(elements) {
        let html = '';

        for (const element of elements) {
            if (element.text_run) {
                html += this.renderTextRun(element.text_run);
            } else if (element.mention_user) {
                html += this.renderMentionUser(element.mention_user);
            } else if (element.mention_doc) {
                html += this.renderMentionDoc(element.mention_doc);
            } else if (element.equation) {
                html += this.renderEquation(element.equation);
            } else if (element.reminder) {
                html += this.renderReminder(element.reminder);
            } else {
                // 其他类型的元素
                console.log('未处理的文本元素类型:', element);
                html += `<span style="color: #666; font-style: italic;">[不支持的元素类型]</span>`;
            }
        }

        return html;
    }

    // 渲染文本运行
    renderTextRun(textRun) {
        let content = this.escapeHtml(textRun.content);

        if (textRun.text_element_style) {
            const style = textRun.text_element_style;
            let classes = [];

            if (style.bold) classes.push('text-bold');
            if (style.italic) classes.push('text-italic');
            if (style.underline) classes.push('text-underline');
            if (style.strikethrough) classes.push('text-strikethrough');
            if (style.inline_code) classes.push('text-inline-code');
            if (style.text_color) classes.push(`text-color-${style.text_color}`);

            if (classes.length > 0) {
                content = `<span class="${classes.join(' ')}">${content}</span>`;
            }

            if (style.link && style.link.url) {
                const url = decodeURIComponent(style.link.url);
                content = `<a href="${url}" target="_blank" rel="noopener noreferrer">${content}</a>`;
            }
        }

        return content;
    }

    // 渲染提及用户
    renderMentionUser(mentionUser) {
        return `<span class="mention-user">@用户</span>`;
    }

    // 渲染提及文档
    renderMentionDoc(mentionDoc) {
        const url = decodeURIComponent(mentionDoc.url);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="mention-doc">📄 文档链接</a>`;
    }

    // 渲染公式
    renderEquation(equation) {
        return `<span class="equation" title="公式: ${equation.content}">${equation.content}</span>`;
    }

    // 渲染日期提醒
    renderReminder(reminder) {
        const expireTime = new Date(parseInt(reminder.expire_time));
        const dateTimeStr = expireTime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isWholeDay = reminder.is_whole_day;
        const displayText = isWholeDay ?
            expireTime.toLocaleDateString('zh-CN') :
            dateTimeStr;

        return `<span class="reminder" title="提醒时间: ${dateTimeStr}">📅 ${displayText}</span>`;
    }

    // 获取对齐类名
    getAlignClass(align) {
        switch (align) {
            case 1: return 'align-left';
            case 2: return 'align-center';
            case 3: return 'align-right';
            default: return 'align-left';
        }
    }

    // 获取图片对齐类名
    getImageAlignClass(align) {
        switch (align) {
            case 1: return 'image-align-left';
            case 2: return 'image-align-center';
            case 3: return 'image-align-right';
            default: return 'image-align-center';
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 从文本元素中提取纯文本
    extractTextFromElements(elements) {
        let text = '';
        for (const element of elements) {
            if (element.text_run) {
                text += element.text_run.content;
            } else if (element.mention_user) {
                text += '@用户';
            } else if (element.mention_doc) {
                text += '文档链接';
            } else if (element.equation) {
                text += element.equation.content;
            } else if (element.reminder) {
                const expireTime = new Date(parseInt(element.reminder.expire_time));
                text += expireTime.toLocaleDateString('zh-CN');
            }
        }
        return text.trim();
    }

    // 生成标题ID
    generateHeadingId(text, blockId) {
        // 清理文本，移除特殊字符
        const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        // 如果清理后的文本为空，使用block_id
        if (!cleanText) {
            return `heading-${blockId}`;
        }
        // 使用前20个字符作为ID
        const shortText = cleanText.substring(0, 20);
        return `heading-${shortText}-${blockId.slice(-8)}`;
    }
}

// 创建渲染器实例
const documentRenderer = new DocumentRenderer(); 