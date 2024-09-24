let usage = {
    'DoubaoAI': 0,
    'Kimi': 0,
    'DeepSeek': 0,
    'HailuoAI': 0
};

let startTime;
let currentSite = 'DoubaoAI';
let chart;

// 滑块配置
const sliderConfigs = {
    stats: {
        title: "使用时长统计",
        content: `<div class="stats"><canvas id="usageChart"></canvas></div>`
    },
    clock: {
        title: "时钟",
        content: `<div class="clock">
                    <div class="clock-face">
                        <div class="hand hour-hand"></div>
                        <div class="hand min-hand"></div>
                        <div class="hand second-hand"></div>
                        <div class="clock-center"></div>
                        <div class="clock-number clock-12">12</div>
                        <div class="clock-number clock-3">3</div>
                        <div class="clock-number clock-6">6</div>
                        <div class="clock-number clock-9">9</div>
                    </div>
                  </div>`
    },
    textStorage: {
        title: "文本存储",
        content: `
            <div class="text-storage">
                <div class="input-container">
                    <input type="text" id="newTextTitle" placeholder="输入标题">
                    <textarea id="newTextContent" placeholder="输入内容"></textarea>
                </div>
                <div class="button-container">
                    <button onclick="addTextItem()" class="add-btn">添加</button>
                    <button onclick="exportCSV()" class="export-btn">导出CSV</button>
                    <button onclick="document.getElementById('csvFile').click()" class="import-btn">导入CSV</button>
                    <button onclick="showConfirmClearModal()" class="clear-btn">清空所有</button>
                    <input type="file" id="csvFile" accept=".csv" style="display:none;" onchange="importCSV()">
                </div>
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="搜索标题...">
                </div>
                <button id="toggleTextItems" class="toggle-btn">收起▲</button>
                <div id="textItems" class="expanded"></div>
            </div>`
    }
};

function exportCSV() {
    let csv = "\uFEFFTitle,Content\n"; // 添加BOM
    const textItems = document.querySelectorAll('.text-item-header, .text-item-content');
    console.log("找到文本项数量：", textItems.length / 2); // 调信息

    if (textItems.length === 0) {
        alert("没有可导出的文本项");
        return;
    }

    for (let i = 0; i < textItems.length; i += 2) {
        const titleElement = textItems[i].querySelector('span:first-child');
        const contentElement = textItems[i+1].querySelector('p');

        if (!titleElement || !contentElement) {
            console.error(`第 ${i/2 + 1} 个项目结构不正:`, textItems[i].innerHTML, textItems[i+1].innerHTML);
            continue; // 跳过这个项目
        }

        const title = titleElement.textContent.trim();
        const content = contentElement.textContent.trim();
        csv += `"${title.replace(/"/g, '""')}","${content.replace(/"/g, '""')}"\n`;
    }

    if (csv === "Title,Content\n") {
        alert("有效的文本项可以导出");
        return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "text_storage.csv");
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function parseCSV(text) {
    const result = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(cell.trim());
                cell = "";
            } else if (char === '\n' || char === '\r') {
                if (cell !== "" || row.length > 0) {
                    row.push(cell.trim());
                    result.push(row);
                    row = [];
                    cell = "";
                }
            } else {
                cell += char;
            }
        }
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell.trim());
        result.push(row);
    }
    return result;
}

function importCSV() {
    console.log("导入函数被调用");
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            console.log("CSV内容读取: ", content);

            const rows = parseCSV(content);
            console.log("CSV行数: ", rows.length);
            let importedCount = 0;

            // 跳过标题行
            for (let i = 1; i < rows.length; i++) {
                const [title, text] = rows[i];
                console.log("解析后的标题: ", title, "内容: ", text);
                if (title && text) {
                    if (addTextItem(title, text)) {
                        importedCount++;
                        console.log("功添加项目");
                    } else {
                        console.log("添加项目失败");
                    }
                } else {
                    console.log("标题或内容为空，跳过");
                }
            }

            console.log(`导入完成，成功导入 ${importedCount} 个项目`);
            alert(`成功导入 ${importedCount} 个文本项`);
            fileInput.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('请选择一个CSV文件');
    }
}

// 生成随机ID的函数
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function loadTextItems() {
    const container = document.getElementById('textItems');
    const searchInput = document.getElementById('searchInput');
    if (!container || !searchInput) return;

    const items = JSON.parse(localStorage.getItem('textItems')) || [];
    
    function renderItems(filteredItems) {
        container.innerHTML = '';
        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'text-item';
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <div class="text-item-header" onclick="toggleTextItem('${item.id}')">
                    <span>${escapeHtml(item.title)}</span>
                    <span class="expand-hint">(点击展开)</span>
                </div>
                <div class="text-item-content">
                    <p>${escapeHtml(item.content)}</p>
                    <div class="button-group">
                        <button onclick="copyTextItem('${item.id}')">复制</button>
                        <button onclick="deleteTextItem('${item.id}')">删除</button>
                    </div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredItems = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm)
        );
        renderItems(filteredItems);
    }

    filterItems(); // 初始渲染

    searchInput.addEventListener('input', filterItems);
}

function toggleTextItem(id) {
    const item = document.querySelector(`.text-item[data-id="${id}"]`);
    if (item) {
        item.classList.toggle('expanded');
        const expandHint = item.querySelector('.expand-hint');
        if (expandHint) {
            expandHint.textContent = item.classList.contains('expanded') ? '(点击收起)' : '(点击展开)';
        }
    }
}

function copyTextItem(id) {
    const items = JSON.parse(localStorage.getItem('textItems')) || [];
    const item = items.find(item => item.id === id);
    if (item) {
        navigator.clipboard.writeText(item.content).then(() => {
            showToast('文本已复制到剪贴板');
        });
    }
}

function deleteTextItem(id) {
    let items = JSON.parse(localStorage.getItem('textItems')) || [];
    items = items.filter(item => item.id !== id);
    localStorage.setItem('textItems', JSON.stringify(items));
    loadTextItems(); // 重新加载列表
    showToast('文本项已删除');
}

function addTextItem(title, content) {
    title = title || document.getElementById('newTextTitle').value.trim();
    content = content || document.getElementById('newTextContent').value.trim();

    if (title && content) {
        const items = JSON.parse(localStorage.getItem('textItems')) || [];
        const newItem = { 
            id: generateRandomId(), // 使用随机生成的ID
            title, 
            content 
        };
        items.push(newItem);
        localStorage.setItem('textItems', JSON.stringify(items));

        // 重新加载所有项目
        loadTextItems();

        // 清空输入框
        document.getElementById('newTextTitle').value = '';
        document.getElementById('newTextContent').value = '';

        showToast('新文本项已添加');
        return true;
    } else {
        showToast('添加失败：标题或内容为空');
        return false;
    }
}

function showConfirmClearModal() {
    const modal = document.getElementById('confirmClearModal');
    modal.style.display = 'flex';
}

function hideConfirmClearModal() {
    const modal = document.getElementById('confirmClearModal');
    modal.style.display = 'none';
}

function clearAllTextItems() {
    // 清空本地存储中的文本项
    localStorage.removeItem('textItems');
    
    // 重新加载列表（这将显示空列表）
    loadTextItems();
    
    // 显示提示消息
    showToast('所有文本项已清空');

    // 隐藏确认模态框
    hideConfirmClearModal();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

function changeIframe(site) {
    if (currentSite) {
        // 更新当前网站的使用时间
        const currentTime = Date.now();
        usage[currentSite] += Math.round((currentTime - startTime) / 1000);
        document.getElementById(currentSite).classList.remove('active');
    }
    document.getElementById(site).classList.add('active');
    startTime = Date.now();
    currentSite = site;
    updateChart();
}
function initSlidersWithoutChart() {
    const container = document.getElementById('sortableContainer');
    container.innerHTML = '';

    const activeSliders = JSON.parse(localStorage.getItem('activeSliders')) || Object.keys(sliderConfigs);

    activeSliders.forEach(sliderId => {
        const slider = sliderConfigs[sliderId];
        if (slider) {
            const sliderElement = document.createElement('div');
            sliderElement.className = 'sortable-item';
            sliderElement.id = sliderId + 'Container';
            sliderElement.innerHTML = `<h3>${slider.title}</h3>${slider.content}`;
            container.appendChild(sliderElement);
        }
    });

    setDate();
    loadTextItems();

    // 如果存在统计滑块，新初始化图表
    if (activeSliders.includes('stats')) {
        // 使用 setTimeout 确保在 DOM 更新后初始化图表
        setTimeout(() => {
            if (document.getElementById('usageChart')) {
                initChart();
            }
        }, 0);
    } else {
        // 如果统计滑块被移除，销毁图表
        if (chart) {
            chart.destroy();
            chart = null;
        }
    }
}

function initChart() {
    const ctx = document.getElementById('usageChart');
    if (!ctx) return;

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(usage),
            datasets: [{
                data: Object.values(usage),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
    
    // 强制更新图表
    updateChart();
}

function updateChart() {
    if (!chart) {
        initChart();
    } else {
        chart.data.datasets[0].data = Object.values(usage);
        chart.update();
    }
}


function setDate() {
    const clockFace = document.querySelector('.clock-face');
    if (!clockFace) return;
    const now = new Date();

    const seconds = now.getSeconds();
    const secondsDegrees = ((seconds / 60) * 360) + 90;
    clockFace.querySelector('.second-hand').style.transform = `rotate(${secondsDegrees}deg)`;

    const mins = now.getMinutes();
    const minsDegrees = ((mins / 60) * 360) + ((seconds/60)*6) + 90;
    clockFace.querySelector('.min-hand').style.transform = `rotate(${minsDegrees}deg)`;

    const hour = now.getHours();
    const hourDegrees = ((hour / 12) * 360) + ((mins/60)*30) + 90;
    clockFace.querySelector('.hour-hand').style.transform = `rotate(${hourDegrees}deg)`;
}

function initSliders() {
    const container = document.getElementById('sortableContainer');
    container.innerHTML = '';

    const activeSliders = JSON.parse(localStorage.getItem('activeSliders')) || Object.keys(sliderConfigs);

    activeSliders.forEach(sliderId => {
        const slider = sliderConfigs[sliderId];
        if (slider) {
            const sliderElement = document.createElement('div');
            sliderElement.className = 'sortable-item';
            sliderElement.id = sliderId + 'Container';
            sliderElement.innerHTML = `<h3>${slider.title}</h3>${slider.content}`;
            container.appendChild(sliderElement);
        }
    });

    setDate();
    loadTextItems();

    // 初始化使用时间统计
    startTime = Date.now();
    usage = JSON.parse(localStorage.getItem('usage')) || {
        'DoubaoAI': 0,
        'Kimi': 0,
        'DeepSeek': 0,
        'HailuoAI': 0
    };

    // 在所有滑块加载完成后，重新初始化图表
    setTimeout(updateChart, 0);

    // 添加这行码来更按钮状态
    updateToggleButtonState();

    // 初始化当前网站
    currentSite = 'DoubaoAI'; // 假设默认网站是豆包AI
    document.getElementById(currentSite).classList.add('active');
    startTime = Date.now();
}

function openSliderEditModal() {
    const modal = document.getElementById('sliderEditModal');
    const checkboxesContainer = document.getElementById('sliderCheckboxes');
    checkboxesContainer.innerHTML = '';

    const activeSliders = JSON.parse(localStorage.getItem('activeSliders')) || Object.keys(sliderConfigs);

    Object.keys(sliderConfigs).forEach(sliderId => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = sliderId + 'Checkbox';
        checkbox.checked = activeSliders.includes(sliderId);

        const label = document.createElement('label');
        label.htmlFor = sliderId + 'Checkbox';
        label.textContent = sliderConfigs[sliderId].title;

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);

        // 修改这里的事件监听逻辑
        checkboxItem.addEventListener('click', function(event) {
            // 如果点击的是复选框本身，不需要额外处理
            if (event.target === checkbox) {
                return;
            }
            // 如果点击的是标签或者复选框项的其他部分
            event.preventDefault(); // 阻止默认行为
            checkbox.checked = !checkbox.checked; // 切换复选框状态
            // 触发change事件，以便可能的其他监听器能够响应
            checkbox.dispatchEvent(new Event('change'));
        });

        checkboxesContainer.appendChild(checkboxItem);
    });

    modal.style.display = 'block';
}

function closeSliderEditModal() {
    document.getElementById('sliderEditModal').style.display = 'none';
}

function saveSliderSettings() {
    const activeSliders = [];
    Object.keys(sliderConfigs).forEach(sliderId => {
        const checkbox = document.getElementById(sliderId + 'Checkbox');
        if (checkbox.checked) {
            activeSliders.push(sliderId);
        }
    });

    localStorage.setItem('activeSliders', JSON.stringify(activeSliders));
    
    initSlidersWithoutChart();
    closeSliderEditModal();
}


function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadTextItems() {
    const container = document.getElementById('textItems');
    const searchInput = document.getElementById('searchInput');
    if (!container || !searchInput) return;

    const items = JSON.parse(localStorage.getItem('textItems')) || [];
    
    function renderItems(filteredItems) {
        container.innerHTML = '';
        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'text-item';
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <div class="text-item-header" onclick="toggleTextItem('${item.id}')">
                    <span>${escapeHtml(item.title)}</span>
                    <span class="expand-hint">(点击展开)</span>
                </div>
                <div class="text-item-content">
                    <p>${escapeHtml(item.content)}</p>
                    <div class="button-group">
                        <button onclick="copyTextItem('${item.id}')">复制</button>
                        <button onclick="deleteTextItem('${item.id}')">删除</button>
                    </div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredItems = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm)
        );
        renderItems(filteredItems);
    }

    filterItems(); // 初始渲染

    searchInput.addEventListener('input', filterItems);
}


function toggleTextItem(id) {
    const item = document.querySelector(`.text-item[data-id="${id}"]`);
    if (item) {
        item.classList.toggle('expanded');
        const expandHint = item.querySelector('.expand-hint');
        if (expandHint) {
            expandHint.textContent = item.classList.contains('expanded') ? '(点击收起)' : '(点击展开)';
        }
    }
}

function copyTextItem(id) {
    const items = JSON.parse(localStorage.getItem('textItems')) || [];
    const item = items.find(item => item.id === id);
    if (item) {
        navigator.clipboard.writeText(item.content).then(() => {
            showToast('文本已复制到剪贴板');
        });
    }
}

function deleteTextItem(id) {
    let items = JSON.parse(localStorage.getItem('textItems')) || [];
    items = items.filter(item => item.id !== id);
    localStorage.setItem('textItems', JSON.stringify(items));
    loadTextItems(); // 重新加载列表
    showToast('文本项已删除');
}

function addTextItem(title, content) {
    title = title || document.getElementById('newTextTitle').value.trim();
    content = content || document.getElementById('newTextContent').value.trim();

    if (title && content) {
        const items = JSON.parse(localStorage.getItem('textItems')) || [];
        const newItem = { 
            id: generateRandomId(), // 使用随机生成的ID
            title, 
            content 
        };
        items.push(newItem);
        localStorage.setItem('textItems', JSON.stringify(items));

        // 重新加载所有项目
        loadTextItems();

        // 清空输入框
        document.getElementById('newTextTitle').value = '';
        document.getElementById('newTextContent').value = '';

        showToast('新文本项已添加');
        return true;
    } else {
        showToast('添加失败：标题或内容为空');
        return false;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

function toggleTextItems(event) {
    if (event.target.id === 'toggleTextItems') {
    const textItems = document.getElementById('textItems');
        const toggleBtn = event.target;
    if (textItems.classList.contains('expanded')) {
        textItems.classList.remove('expanded');
            textItems.classList.add('collapsed');
        toggleBtn.textContent = '展开▼';
    } else {
            textItems.classList.remove('collapsed');
        textItems.classList.add('expanded');
        toggleBtn.textContent = '收起▲';
    }
    }
}

function toggleUpdateLog() {
    updateLogContent.style.display = updateLogContent.style.display === 'none' ? 'block' : 'none';
}

// 侧边栏收起功能
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const sidebarTitle = document.getElementById('sidebarTitle');
const sidebarLinks = document.getElementById('sidebarLinks');
const sortableContainer = document.getElementById('sortableContainer');
const dragHint = document.querySelector('.drag-hint');
const updateLog = document.getElementById('updateLog');
const updateLogContent = document.getElementById('updateLogContent');
const editSliderBtn = document.querySelector('.edit-slider-btn');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebarTitle.classList.toggle('hidden');
    sidebarLinks.classList.toggle('hidden');
    sortableContainer.classList.toggle('hidden');
    dragHint.classList.toggle('hidden');
    updateLog.classList.toggle('hidden');
    updateLogContent.classList.toggle('hidden');
    editSliderBtn.classList.toggle('hidden');
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '☰' : '×';
});

function initializeOrUpdateUsage() {
    let currentUsage = JSON.parse(localStorage.getItem('usage')) || {};
    
    // 检查是否存在旧的 ChatGLM 数据
    if ('ChatGLM' in currentUsage) {
        // 如果存在，将其数据转移到 DoubaoAI
        currentUsage['DoubaoAI'] = currentUsage['ChatGLM'];
        delete currentUsage['ChatGLM'];
    }
    
    // 确保所有需要的键都存在
    const requiredKeys = ['DoubaoAI', 'Kimi', 'DeepSeek', 'HailuoAI'];
    requiredKeys.forEach(key => {
        if (!(key in currentUsage)) {
            currentUsage[key] = 0;
        }
    });
    
    // 移除任何不需要的键
    Object.keys(currentUsage).forEach(key => {
        if (!requiredKeys.includes(key)) {
            delete currentUsage[key];
        }
    });
    
    // 更新本地存储和全局变量
    localStorage.setItem('usage', JSON.stringify(currentUsage));
    usage = currentUsage;
}

// 在文档加载完成后调用这个函数
document.addEventListener('DOMContentLoaded', function() {
    initializeOrUpdateUsage();
    initSliders();
    setInterval(() => {
        setDate();
        if (currentSite) {
            const currentTime = Date.now();
            usage[currentSite] += Math.round((currentTime - startTime) / 1000);
            startTime = currentTime; // 更新开始时间
            updateChart();
            // 保存使用时间到本地存储
            localStorage.setItem('usage', JSON.stringify(usage));
        }
    }, 1000);

    // 始化可拖动排序
new Sortable(sortableContainer, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: function() {
        const newOrder = Array.from(sortableContainer.children).map(item => item.id.replace('Container', ''));
        localStorage.setItem('activeSliders', JSON.stringify(newOrder));
        initSlidersWithoutChart(); // 使用新的初始化函数
    }
});

    // 添加一些动画效果
    document.querySelectorAll('.sidebar a, .sortable-item, .update-log').forEach(element => {
        element.addEventListener('mouseover', () => {
            element.style.transform = 'scale(1.05)';
        });
        element.addEventListener('mouseout', () => {
            element.style.transform = 'scale(1)';
        });
    });

    // 使用事件委托，将事件监听器添加到父元素上
    document.getElementById('sortableContainer').addEventListener('click', toggleTextItems);

    // 初化时更新按钮状态
    updateToggleButtonState();

    // 为清空按钮添加事件监听器
    const clearButton = document.querySelector('.clear-btn');
    if (clearButton) {
        clearButton.addEventListener('click', showConfirmClearModal);
    }

    // 为确认清空按钮添加事件监听器
    const confirmClearButton = document.getElementById('confirmClear');
    if (confirmClearButton) {
        confirmClearButton.addEventListener('click', clearAllTextItems);
    }

    // 为取消清空按钮添加事件监听器
    const cancelClearButton = document.getElementById('cancelClear');
    if (cancelClearButton) {
        cancelClearButton.addEventListener('click', hideConfirmClearModal);
    }

    // 使用事件委托来处理更新日志的点击
    document.querySelector('.sidebar').addEventListener('click', function(event) {
        if (event.target.id === 'updateLog') {
            toggleUpdateLog();
        }
    });

    // 初始化更新日志的显示状态
    const updateLogContent = document.getElementById('updateLogContent');
    updateLogContent.style.display = 'none';
});

// 添加一个新函数来更新按钮状态
function updateToggleButtonState() {
        const textItems = document.getElementById('textItems');
    const toggleBtn = document.getElementById('toggleTextItems');
    if (textItems && toggleBtn) {
        if (textItems.classList.contains('expanded')) {
            toggleBtn.textContent = '收起▲';
    } else {
            toggleBtn.textContent = '展开▼';
        }
    }
}

// 生成随机ID的函数
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showConfirmClearModal() {
    const modal = document.getElementById('confirmClearModal');
    modal.style.display = 'flex';
}

function hideConfirmClearModal() {
    const modal = document.getElementById('confirmClearModal');
    modal.style.display = 'none';
}

function clearAllTextItems() {
    // 清空本地存储中的文本项
    localStorage.removeItem('textItems');
    
    // 重新加载列表（这将显示空列表）
    loadTextItems();
    
    // 显示提示消息
    showToast('所有文本项已清空');

    // 隐藏确认模态框
    hideConfirmClearModal();
}


