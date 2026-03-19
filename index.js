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

localSearchInputDom.addEventListener("input", (e) => {}
)

const localSearchConfirmDom = document.querySelector(".local-search-confirm");

localSearchConfirmDom.addEventListener("click", (e) => {

})

