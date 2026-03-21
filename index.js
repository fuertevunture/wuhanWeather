// 数据

// 只要是要呈现到页面的数据，都要进行代理处理
const searchContent = {
    value: '',
}

const searchContentProxy = new Proxy(searchContent, {
    get(target, key) {
        return Reflect.get(...arguments);
    },
    set(target, key, value) {
        Reflect.set(target, key, value);
        renderLocalSearchInput();
        return true;
    },
    deleteProperty(target, p) {
        Reflect.delete(target, p);
        return true;
    }
})

const recentList = [];

const recentListProxy = new Proxy(recentList, {
    get(target, key) {
        return Reflect.get(...arguments);
    },
    set(target, key, value) {
        Reflect.set(target, key, value);
        renderLocalRecentList();
        saveRecentList();
        return true;
    }
})

// 初始化时获取持久化值
window.addEventListener('DOMContentLoaded', () => {
    // 全量更新数组的方式
    let localRecentList = JSON.parse(localStorage.getItem('recentList')) || [];
    for (let recent of localRecentList) {
        recentListProxy.push(recent);
    }
})
// 按固定频率更新持久化值
// setInterval(() => {
//     localStorage.setItem('recentList', JSON.stringify(recentListProxy));
// },10000);

// 将持久化触发放到代理中
function saveRecentList() {
    localStorage.setItem('recentList', JSON.stringify(recentListProxy));
}

let todayData = {};


//主题样式按钮的切换
const headerThemeModeDomList = Array.from(document.querySelectorAll(".header-theme-mode"));
let hiddenHeaderThemeModeDom = document.querySelector(".hidden_header-theme-mode");

headerThemeModeDomList.forEach(headerThemeMode => {
    headerThemeMode.addEventListener("click", (e) => {
        hiddenHeaderThemeModeDom.classList.remove("hidden_header-theme-mode");
        headerThemeMode.classList.add("hidden_header-theme-mode");
        hiddenHeaderThemeModeDom = headerThemeMode;
    })
});

//搜索栏的聚焦
const localSearchDom = document.querySelector(".local-search");
const localSearchInputDom = document.querySelector(".local-search_input");

localSearchInputDom.addEventListener("focus", (e) => {
    localSearchDom.classList.add("focused_local-search");
})

localSearchInputDom.addEventListener("blur", (e) => {
    localSearchDom.classList.remove("focused_local-search");
})

localSearchInputDom.addEventListener("change", (e) => {
    searchContentProxy.value = e.target.value;
})

function renderLocalSearchInput() {
    localSearchInputDom.value = searchContentProxy.value;
}

localSearchInputDom.addEventListener("input", (e) => {
    moreTryWeb(getWeatherData, []);
})

const localSearchConfirmDom = document.querySelector(".local-search-confirm");
localSearchConfirmDom.addEventListener("click", (e) => {
    const idx = recentList.indexOf(searchContentProxy.value);
    if (idx !== -1) {
        recentListProxy.splice(idx, 1);
        recentListProxy.unshift(searchContentProxy.value);
    }else{
        addRecentItem(searchContentProxy.value);
    }
    getTodayWeather();
})

// 获取当前位置
const localCurrentDom = document.querySelector(".local-current");
localCurrentDom.addEventListener("click", async (e) => {
    let p;
    await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((position) => {
            p = position.coords;
            resolve();
        })
    });
    console.log(p);
    const city = await moreTryWeb(getCurrentCity, [p]);
    console.log(city);
    searchContentProxy.value = city[0].name;
    const idx = recentList.indexOf(searchContentProxy.value);
    if (idx !== -1) {
        recentListProxy.splice(idx, 1);
        recentListProxy.unshift(searchContentProxy.value);
    }else{
        addRecentItem(searchContentProxy.value);
    }
    getTodayWeather();
})

const localRecentDom = document.querySelector(".local-recent");
const localRecentListDom = document.querySelector(".local-recent-list");

function renderLocalRecentList() {
    localRecentListDom.innerHTML = '';
    if (recentList.length === 0) {
        const div = document.createElement("div");
        div.className = "local-recent-list-void";
        div.textContent = "no history";
        localRecentListDom.appendChild(div);
    } else {
        const localRecentListFrag = document.createDocumentFragment();
        recentList.forEach(recent => {
            const div = document.createElement("div");
            div.classList.add("local-recent-list-item");
            div.textContent = recent;
            const delDiv = document.createElement("div");
            delDiv.classList.add("local-recent-list-item-del");
            delDiv.textContent = "X";
            div.appendChild(delDiv);
            localRecentListFrag.appendChild(div);
        })
        localRecentListDom.appendChild(localRecentListFrag)
    }
}

function addRecentItem(item) {
    recentListProxy.push(item);
}

const localRecentListItemDomList = Array.from(document.querySelectorAll(".local-recent-list-item"));

// 对历史记录们进行事件委托处理
localRecentListDom.addEventListener("click", (e) => {
    // 1. 优先处理删除按钮
    const delBtn = e.target.closest(".local-recent-list-item-del");
    if (delBtn) {
        const item = delBtn.closest(".local-recent-list-item");
        if (item) {
            // 提取纯文本（不含删除按钮文字）
            let text = '';
            for (const node of item.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            const idx = recentList.indexOf(text);
            if (idx !== -1) {
                recentListProxy.splice(idx, 1); // 删除该项
            }
        }
        e.stopPropagation(); // 可选，阻止事件继续冒泡
        return; // 关键：不再执行后续逻辑
    }

    // 2. 处理点击历史项本身（非删除按钮）
    const item = e.target.closest(".local-recent-list-item");
    if (!item) return;

    // 提取纯文本
    let text = '';
    for (const node of item.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        }
    }

    const idx = recentList.indexOf(text);
    if (idx !== -1) {
        // 将该项移到最前面
        recentListProxy.splice(idx, 1);
        recentListProxy.unshift(text);
    }

    // 更新搜索框并查询天气
    searchContentProxy.value = text;
    getTodayWeather();
});

/**
 * 每次执行一次查询，都包括：
 *  1.网络获取
 *  2.天气数据渲染
 *  3.增加历史记录
 */



async function getTodayWeather() {
    loadingDom.style.display = "flex";
    todayData = await moreTryWeb(getWeatherData, []);
    await new Promise((resolve) => {
        setTimeout(resolve, 1000)
    });
    loadingDom.style.display = "none";
    renderToday();
}

const loadingDom = document.querySelector(".loading");
const todayDom = document.querySelector(".today");

const todayBaseInfoGeoDom = document.querySelector(".today-base-info-geo");
const todayBaseInfoDateDom = document.querySelector(".today-base-info-date");
const todayTempExactStatisticDom = document.querySelector(".today-temp-exact-statistic");
const todayTempExactDescriptionDom = document.querySelector(".today-temp-exact-description");
const todayTempHumanDom = document.querySelector(".today-temp-human");
const todayPhysicWindInfoValueDom = document.querySelector(".today-physic-wind-info-value");
const todayPhysicHumidityInfoValueDom = document.querySelector(".today-physic-humidity-info-value");
const todayPhysicPressureInfoValueDom = document.querySelector(".today-physic-pressure-info-value");
const todayPhysicVisibilityInfoValueDom = document.querySelector(".today-physic-visibility-info-value");
const todayBaseLogoDom = document.querySelector(".today-base-logo");


function renderToday() {
    todayBaseInfoDateDom.textContent = new Date().toDateString();

    todayBaseInfoGeoDom.textContent = todayData.name;
    todayTempExactStatisticDom.textContent = todayData.main.temp + "℃";
    todayTempExactDescriptionDom.textContent = todayData.weather[0].description;
    todayTempHumanDom.textContent = "Feels like:" + todayData.main.feels_like + "℃";
    todayPhysicWindInfoValueDom.textContent = todayData.wind.speed + "m/s";
    todayPhysicHumidityInfoValueDom.textContent = todayData.main.humidity + "%";
    todayPhysicPressureInfoValueDom.textContent = todayData.main.pressure + "hPa";
    todayPhysicVisibilityInfoValueDom.textContent = todayData.visibility / 1000 + "km";

    // Apply weather theme
    const themeClass = getWeatherTheme(todayData.weather[0].id);
    const currentWeatherElement = document.querySelector('.today');
    currentWeatherElement.className = 'today';
    if (themeClass) {
        currentWeatherElement.classList.add(themeClass);
    }
    todayBaseLogoDom.innerHTML = getWeatherIcon(todayData.weather[0].id)

    todayDom.style.display = "block";
}

// Get weather theme class based on weather condition
const getWeatherTheme = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) {
        return 'weather-theme-thunderstorm';
    } else if (weatherId >= 500 && weatherId < 600) {
        return 'weather-theme-rain';
    } else if (weatherId >= 600 && weatherId < 700) {
        return 'weather-theme-snow';
    } else if (weatherId === 800) {
        return 'weather-theme-clear';
    } else if (weatherId > 800) {
        return 'weather-theme-clouds';
    }
    return '';
};

// Get weather icon class based on weather condition
const getWeatherIcon = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) {
        return '<i class="fas fa-bolt"></i>'; // Thunderstorm
    } else if (weatherId >= 300 && weatherId < 400) {
        return '<i class="fas fa-cloud-rain"></i>'; // Drizzle
    } else if (weatherId >= 500 && weatherId < 600) {
        return '<i class="fas fa-cloud-showers-heavy"></i>'; // Rain
    } else if (weatherId >= 600 && weatherId < 700) {
        return '<i class="fas fa-snowflake"></i>'; // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
        return '<i class="fas fa-smog"></i>'; // Atmosphere
    } else if (weatherId === 800) {
        return '<i class="fas fa-sun"></i>'; // Clear
    } else {
        return '<i class="fas fa-cloud"></i>'; // Clouds
    }
};

//网络数据获取
const moreTryWeb = async (webFn, fnArgs) => {
    for (let i = 0; i < 3; i++) {
        try {
            return await webFn(...fnArgs);
        } catch (err) {
            if (i === 2) {
                console.error(err);
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}


const getWeatherData = async () => {
    const getWeatherDataUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    getWeatherDataUrl.searchParams.set("q", searchContent.value);
    getWeatherDataUrl.searchParams.set("appid", "04e6eadefb196fce9bf51eb29f053749");
    getWeatherDataUrl.searchParams.set("units", "metric")
    return await fetch(getWeatherDataUrl).then(res => res.json());
}

const getCurrentCity = async (position) => {
    const getCurrentCityUrl = new URL("https://api.openweathermap.org/geo/1.0/reverse");
    getCurrentCityUrl.searchParams.set("lat", position.latitude);
    getCurrentCityUrl.searchParams.set("lon", position.longitude);
    getCurrentCityUrl.searchParams.set("appid", "04e6eadefb196fce9bf51eb29f053749");
    getCurrentCityUrl.searchParams.set("limit", 1);
    return await fetch(getCurrentCityUrl).then(res => res.json());
}