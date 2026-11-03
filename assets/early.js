(function () {
  var d = document.documentElement;
  d.classList.add("js");
  if (/[?&]light=a(&|$)/.test(location.search)) d.classList.add("no-light");
  try {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) d.classList.add("motion");
  } catch (e) {  }
})();
