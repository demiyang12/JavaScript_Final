import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================
// 0. 配置区域
// =========================================

// Firebase 配置 (使用你提供的 Key)
const firebaseConfig = {
  apiKey: "AIzaSyAMIT38af7QwiB9iiw8tl0v6k5pm0rZJ4I",
  authDomain: "yunnanodyssey.firebaseapp.com",
  projectId: "yunnanodyssey",
  storageBucket: "yunnanodyssey.firebasestorage.app",
  messagingSenderId: "184293573238",
  appId: "1:184293573238:web:3ae1188dfde704b6bad557",
  measurementId: "G-LDE0GNT38D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const CURRENT_USER_ID = "user_demo_001"; // 模拟用户ID

// Mapbox Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hyaXN0aW5lY3VpMTIiLCJhIjoiY21qYTNiaXRnMDE4eTNrcHR6NnY2Y29ubCJ9.86q3rX0N3qbsbgvP9-6YAw';

// 全局变量
let poiData = []; 
const routeColors = ['#3494a6', '#e0b341', '#bf4328', '#1a3c5a', '#8e44ad', '#27ae60'];
let totalDaysCount = 0;
let map;
let routeLayer;
let markersLayer;

// =========================================
// 1. 初始化程序 (Init)
// =========================================

async function initInteractive() {
    console.log("Initializing Interactive Planner...");

    // 1.1 初始化地图
    // 默认定位到云南大致中心
    map = L.map('map', { zoomControl: false }).setView([24.5, 101.5], 7);
    
    // 添加右上角缩放控件 (CSS会将它向左推移，避免被侧边栏遮挡)
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // 初始化图层组
    routeLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    // 1.2 设置默认输入值 (2025.12.18 - 2025.12.23, Budget 10)
    // 注意：HTML 中如果已经写了 value，JS 这里会覆盖它，确保逻辑统一
    document.getElementById('dateFrom').value = "2025-12-18";
    document.getElementById('dateTo').value = "2025-12-23";
    document.getElementById('budgetInput').value = "10";

    try {
        // 1.3 并行加载：POI数据 和 Wishlist数据
        const [poiResponse, wishlistDoc] = await Promise.all([
            fetch('poi_new2_updated_with_pics.geojson'),
            getDoc(doc(db, "users", CURRENT_USER_ID))
        ]);

        if (!poiResponse.ok) throw new Error("Failed to fetch GeoJSON");
        const geoJson = await poiResponse.json();
        
        // 1.4 解析 GeoJSON 数据
        poiData = geoJson.features.map(f => {
            const p = f.properties;
            // 处理 Cost: "$3/person" -> 3
            const rawCost = p.Buget || ""; 
            const cost = parseInt(rawCost.replace(/[^0-9]/g, '') || 0);

            return {
                id: String(p.osm_id), // 强制转字符串，确保对比无误
                name: p.name_E || p.name, // 优先显示英文名
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                price: cost,
                ele: parseFloat(p.Elevation || 0),
                cat: p.Filter, // Nature, Culture, etc.
                wifi: p.Wifi,
                park: p.Parking
            };
        });

        // 1.5 获取 Wishlist ID 集合
        let wishlistIds = new Set();
        if (wishlistDoc.exists()) {
            const dbList = wishlistDoc.data().wishlist || [];
            // 确保数据库里的 ID 也转为字符串对比
            dbList.forEach(id => wishlistIds.add(String(id)));
        }

        // 1.6 渲染地图标记 (只渲染 Wishlist 中的点)
        renderMarkers(wishlistIds);

        // 1.7 初始化侧边栏日期容器 (基于默认日期)
        syncDaysWithDate();

    } catch (e) {
        console.error("Error initializing interactive page:", e);
        alert("Failed to load data. Please ensure 'poi_new2_final.geojson' exists and you are running on a server (Live Server).");
    }
}

// 渲染 Marker 逻辑
function renderMarkers(wishlistIds) {
    markersLayer.clearLayers();
    
    let hasPoints = false;

    poiData.forEach(p => {
        // ★★★ 核心过滤：只显示 Wishlist 中的点 ★★★
        if (!wishlistIds.has(p.id)) return;
        
        hasPoints = true;

        // 根据类别定义样式
        let cssClass = `marker-wishlist cat-${p.cat}`; 
        let iconHtml = '<i class="fa-solid fa-location-dot"></i>';
        
        if(p.cat === 'Nature') iconHtml = '<i class="fa-solid fa-mountain"></i>';
        if(p.cat === 'Culture') iconHtml = '<i class="fa-solid fa-landmark"></i>';
        if(p.cat === 'Food') iconHtml = '<i class="fa-solid fa-utensils"></i>';
        if(p.cat === 'Stay') iconHtml = '<i class="fa-solid fa-bed"></i>';

        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin ${cssClass}">${iconHtml}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(markersLayer);

        // 绑定 Popup
        marker.bindPopup(() => {
            // 动态生成下拉菜单 (Day 1, Day 2...)
            let optionsHtml = '';
            if (totalDaysCount > 0) {
                for(let i=1; i<=totalDaysCount; i++) {
                    optionsHtml += `<option value="day${i}">Day ${i}</option>`;
                }
            } else {
                 optionsHtml = `<option disabled>Set dates first</option>`;
            }

            return `
                <div style="text-align:center; min-width:160px;">
                    <h4 style="margin:0 0 5px 0;color:#1a3c5a;">${p.name}</h4>
                    <p style="margin:0 0 8px 0;font-size:12px;color:#666;">
                       Ele: ${p.ele}m | Cost: $${p.price}
                    </p>
                    <div style="margin-bottom:8px;font-size:0.8rem;color:#888;">
                       ${p.wifi ? '<i class="fa-solid fa-wifi" title="WiFi"></i> ' : ''}
                       ${p.park ? '<i class="fa-solid fa-square-parking" title="Parking"></i> ' : ''}
                    </div>
                    <div class="popup-controls">
                        <select id="targetDaySelect-${p.id}" class="popup-day-select">
                            ${optionsHtml}
                        </select>
                        <button class="popup-add-btn" onclick="window.addToPlan('${p.id}')">Add</button>
                    </div>
                </div>
            `;
        });
    });

    if (!hasPoints) {
        console.log("Wishlist is empty or no matches found.");
    }
}


// ============================================
// 2. 日期计算 & 侧边栏容器逻辑
// ============================================

const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const totalDaysDisplay = document.getElementById('totalDaysDisplay');
const daysContainer = document.getElementById('daysContainer');
const btnAddDay = document.getElementById('btnAddDay');

function syncDaysWithDate() {
    const dFromVal = dateFromInput.value;
    const dToVal = dateToInput.value;

    if (!dFromVal || !dToVal) return; 

    const d1 = new Date(dFromVal);
    const d2 = new Date(dToVal);
    
    // 简单校验
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) {
        totalDaysDisplay.innerText = "Invalid";
        return;
    }

    // 计算天数差异
    const diffTime = Math.abs(d2 - d1);
    const targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    
    totalDaysDisplay.innerText = targetDays + " Days";
    
    // 增量更新 DOM (避免重绘所有导致已拖拽的项丢失)
    if (targetDays > totalDaysCount) {
        for (let i = totalDaysCount + 1; i <= targetDays; i++) {
            createDaySection(i);
        }
    } 
    else if (targetDays < totalDaysCount) {
        for (let i = totalDaysCount; i > targetDays; i--) {
            const dayEl = document.getElementById(`day${i}`);
            if (dayEl) {
                const section = dayEl.closest('.day-section');
                if (section) section.remove();
            }
        }
    }
    
    totalDaysCount = targetDays;
    // 每次日期变动，都要更新全局计算（可能删除了某天导致Cost变化）
    updateGlobalState(false);
}

function createDaySection(dayIndex) {
    const div = document.createElement('div');
    div.className = 'day-section';
    div.innerHTML = `
        <div class="day-title">DAY ${dayIndex}</div>
        <ul class="waypoint-list" id="day${dayIndex}"></ul>
    `;
    daysContainer.appendChild(div);
    
    // 初始化 Sortable (拖拽)
    new Sortable(document.getElementById(`day${dayIndex}`), {
        group: 'shared', 
        animation: 150, 
        ghostClass: 'sortable-ghost',
        onEnd: () => updateGlobalState(false) // 拖拽结束后重新计算路线
    });
}

// 按钮：增加一天
btnAddDay.addEventListener('click', function() {
    const d2 = new Date(dateToInput.value);
    d2.setDate(d2.getDate() + 1);
    dateToInput.value = d2.toISOString().split('T')[0];
    syncDaysWithDate();
});

// 监听日期变化
dateFromInput.addEventListener('change', syncDaysWithDate);
dateToInput.addEventListener('change', syncDaysWithDate);


// ============================================
// 3. 行程操作 (Add / Remove)
// ============================================

// 添加到行程 (挂载在 window 上以便 HTML onclick 调用)
window.addToPlan = function(idString) {
    const p = poiData.find(x => x.id === idString);
    if (!p) return;

    const selectEl = document.getElementById(`targetDaySelect-${idString}`);
    const targetDayId = selectEl ? selectEl.value : null;

    if(!targetDayId) {
        alert("Please select a day first.");
        return;
    }
    
    const list = document.getElementById(targetDayId);
    if (!list) return; 

    const li = document.createElement('li');
    li.className = 'trip-item';
    // 将数据存在 dataset 中，供计算使用
    li.dataset.lat = p.lat; 
    li.dataset.lng = p.lng; 
    li.dataset.ele = p.ele; 
    li.dataset.price = p.price; 
    li.dataset.name = p.name;
    
    // 根据天数给左边框上色
    const dayIndex = parseInt(targetDayId.replace('day', '')) - 1;
    const color = routeColors[dayIndex % routeColors.length];
    li.style.borderLeftColor = color;

    li.innerHTML = `
        <div class="item-info">
            <span class="item-name">${p.name}</span>
            <span class="item-meta">Ele: ${p.ele}m</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
            <span class="item-price">$${p.price}</span>
            <i class="fa-solid fa-xmark item-remove" onclick="window.removePoint(this)"></i>
        </div>
    `;

    list.appendChild(li);
    map.closePopup();
    updateGlobalState(true); 
};

// 移除路点
window.removePoint = function(el) {
    el.closest('li').remove();
    updateGlobalState(false);
};


// ============================================
// 4. 全局计算核心 (Cost, Chart, Routing)
// ============================================

async function updateGlobalState(isNewAdd) {
    let totalCost = 0;
    let allPointsFlat = []; // 用于图表 (扁平数组)
    let groupedPoints = []; // 用于地图路径 (按天分组)
    
    // 遍历所有天的列表
    const allLists = document.querySelectorAll('.waypoint-list');
    
    allLists.forEach((list) => {
        const dayPoints = [];
        const items = list.querySelectorAll('.trip-item');
        
        items.forEach(item => {
            // 累加花费
            totalCost += parseInt(item.dataset.price || 0);
            
            // 收集数据
            const p = {
                lat: parseFloat(item.dataset.lat),
                lng: parseFloat(item.dataset.lng),
                ele: parseInt(item.dataset.ele || 0),
                name: item.dataset.name
            };
            dayPoints.push(p);
            allPointsFlat.push(p);
        });
        
        // 只有某天有至少1个点才放入组
        if(dayPoints.length > 0) groupedPoints.push(dayPoints);
    });

    // 4.1 更新文本显示
    const costEl = document.getElementById('totalCostDisplay');
    costEl.innerText = `$${totalCost}`;
    document.getElementById('totalStopsDisplay').innerText = allPointsFlat.length;

    // 4.2 预算检查
    const budgetLimit = parseInt(document.getElementById('budgetInput').value) || 0;
    
    if (totalCost > budgetLimit) {
        costEl.classList.add('over-budget'); // CSS 变红
        if (isNewAdd) {
            alert(`⚠️ Budget Exceeded!\nCurrent: $${totalCost} / Limit: $${budgetLimit}`);
        }
    } else {
        costEl.classList.remove('over-budget');
    }

    // 4.3 更新地图路径 (异步)
    await updateRoute(groupedPoints); 

    // 4.4 更新高程图表
    updateChart(allPointsFlat);
}

// 监听预算输入框变化
document.getElementById('budgetInput').addEventListener('input', () => updateGlobalState(false));


// ============================================
// 5. 辅助功能 (Routing & Chart)
// ============================================

// Mapbox 路径规划
async function updateRoute(groupedPoints) {
    routeLayer.clearLayers();
    
    // 遍历每一天的数据
    for (let i = 0; i < groupedPoints.length; i++) {
        const points = groupedPoints[i];
        
        // 如果这天只有1个点，没法画线，画个简单的圆或跳过
        if (points.length < 2) continue;

        const color = routeColors[i % routeColors.length];
        
        // 构造 Mapbox 请求 URL (lng,lat;lng,lat)
        const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                // 绘制路线
                L.geoJSON(data.routes[0].geometry, {
                    style: { 
                        color: color, 
                        weight: 6, 
                        opacity: 0.9, 
                        lineJoin: 'round' 
                    }
                }).addTo(routeLayer);
            }
        } catch (e) {
            console.warn(`Routing error Day ${i+1}:`, e);
            // 降级处理：如果 API 失败，画直线
            const latlngs = points.map(p => [p.lat, p.lng]);
            L.polyline(latlngs, { color: color, weight: 4, dashArray: '5, 10' }).addTo(routeLayer);
        }
    }
}

// Chart.js 高程图更新
let myChart = null;
function updateChart(points) {
    const ctx = document.getElementById('elevationChart').getContext('2d');
    
    if (myChart) myChart.destroy();
    
    const chartColor = '#3494a6'; 

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: points.map(p => p.name), // X轴：地点名
            datasets: [{
                label: 'Elevation (m)', 
                data: points.map(p => p.ele), // Y轴：海拔
                borderColor: chartColor, 
                backgroundColor: 'rgba(52, 148, 166, 0.2)', 
                fill: true, 
                tension: 0.4, 
                pointRadius: 4
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: false },
            scales: { 
                x: { display: false }, // 隐藏 X 轴文字，避免拥挤
                y: { display: true, grid: {color: '#eee'} } 
            }
        }
    });
}

// 启动
initInteractive();