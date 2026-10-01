// Slide navigation for the video presentation: side dots, progress bar,
// keyboard (arrows / PageUp / PageDown / Home / End, F = full-screen), and
// pausing videos that scroll out of view.
(function () {
  'use strict';
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const dots = document.getElementById('dots');
  const bar = document.querySelector('#progress span');
  let current = 0;

  slides.forEach((s, i) => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.setAttribute('aria-label', s.dataset.title || s.id);
    a.innerHTML = '<span>' + (s.dataset.title || s.id) + '</span>';
    a.addEventListener('click', (e) => { e.preventDefault(); go(i); });
    dots.appendChild(a);
  });

  function setActive(i) {
    current = i;
    [...dots.children].forEach((d, j) => d.classList.toggle('active', j === i));
    bar.style.width = ((i + 1) / slides.length) * 100 + '%';
    if (history.replaceState) history.replaceState(null, '', '#' + slides[i].id);
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // which slide is in view; pause videos that leave it
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.55) setActive(slides.indexOf(e.target));
      if (!e.isIntersecting) e.target.querySelectorAll('video').forEach((v) => v.pause());
    });
  }, { root: deck, threshold: [0, 0.55] });
  slides.forEach((s) => io.observe(s));

  // in-page links scroll inside the deck
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('#dots')) return;
    const i = slides.findIndex((s) => '#' + s.id === a.getAttribute('href'));
    if (i >= 0) { e.preventDefault(); go(i); }
  });

  function togglePresent() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  document.getElementById('presentBtn').addEventListener('click', togglePresent);
  document.addEventListener('fullscreenchange', () => document.body.classList.toggle('presenting', !!document.fullscreenElement));

  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'VIDEO' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); go(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); go(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    else if (e.key === 'f' || e.key === 'F') togglePresent();
  });

  // ---------- narration: subtitles + synced transcript ----------
  // Cues come from narration.js (generated from videos/*.vtt): browsers won't
  // load .vtt tracks for a page opened from disk, so they're attached as Blob URLs.
  const NARR = window.KAG_NARRATION || {};
  const ts = (s) => { const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  const vttTime = (s) => new Date(s * 1000).toISOString().slice(11, 23);
  document.querySelectorAll('.player video').forEach((video) => {
    const key = (video.getAttribute('src') || '').split('/').pop().replace(/\.mp4$/, '');
    const cues = NARR[key];
    if (!cues || !cues.length) return;
    const vtt = 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.text}\n`).join('\n');
    const track = document.createElement('track');
    track.kind = 'captions'; track.label = 'English (narration)'; track.srclang = 'en';
    track.src = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    video.appendChild(track);

    const box = document.createElement('details');
    box.className = 'transcript';
    box.innerHTML = '<summary>Narration transcript <span>(' + cues.length + ' lines · click a line to jump there)</span></summary><ol></ol>';
    const ol = box.querySelector('ol');
    cues.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = '<button type="button"><time>' + ts(c.start) + '</time><span></span></button>';
      li.querySelector('span').textContent = c.text;
      li.querySelector('button').addEventListener('click', () => { video.currentTime = c.start + 0.01; video.play().catch(() => {}); });
      ol.appendChild(li);
    });
    video.closest('.player').appendChild(box);
    const items = [...ol.children];
    let last = -1;
    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      let i = -1;
      for (let k = 0; k < cues.length; k++) if (cues[k].start <= t + 0.05) i = k;
      if (i === last) return;
      if (last >= 0) items[last].classList.remove('now');
      if (i >= 0) {
        items[i].classList.add('now');
        // scroll only the transcript list (scrollIntoView would also move the slide deck)
        if (box.open) ol.scrollTo({ top: items[i].offsetTop - ol.offsetTop - ol.clientHeight / 3, behavior: 'smooth' });
      }
      last = i;
    });
  });

  // open on the slide named in the URL
  const start = slides.findIndex((s) => '#' + s.id === location.hash);
  if (start > 0) slides[start].scrollIntoView({ block: 'start' });
  setActive(Math.max(0, start));
})();
