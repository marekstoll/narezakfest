(() => {
  const button = document.getElementById('playFestivalVideo');
  if (!button) return;
  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/QqBvuIiqPLo?autoplay=1';
    iframe.title = 'NÁŘEZÁKFEST 2026 – video z festivalu';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
    iframe.focus();
  }, {once:true});
})();
