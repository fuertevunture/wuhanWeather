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

