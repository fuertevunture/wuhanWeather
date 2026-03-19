// 数据
let searchContent = '';


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
    searchContent = e.target.value;
})

localSearchInputDom.addEventListener("input", (e) => {
    }
)

const localSearchConfirmDom = document.querySelector(".local-search-confirm");

localSearchConfirmDom.addEventListener("click", (e) => {
    console.log(searchContent);
    console.log(moreTryWeb(getWeatherData));
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
    const city = await moreTryWeb(getCurrentCity,[p]);
    console.log(city);
    searchContent = city[0].name;
})


const moreTryWeb = async (webFn,fnArgs) => {
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
    getWeatherDataUrl.searchParams.set("q", searchContent);
    getWeatherDataUrl.searchParams.set("appid", "04e6eadefb196fce9bf51eb29f053749");
    getWeatherDataUrl.searchParams.set("units", "metric")
    return await fetch(getWeatherDataUrl).then(res => res.json());
}

const getCurrentCity = async (position) => {
    const getCurrentCityUrl = new URL("https://api.openweathermap.org/geo/1.0/reverse");
    getCurrentCityUrl.searchParams.set("lat",position.latitude);
    getCurrentCityUrl.searchParams.set("lon",position.longitude);
    getCurrentCityUrl.searchParams.set("appid", "04e6eadefb196fce9bf51eb29f053749");
    getCurrentCityUrl.searchParams.set("limit",1);
    return await fetch(getCurrentCityUrl).then(res => res.json());
}