<template>
  <div class="opening-book" aria-hidden="true">
    <div class="book-shadow" />
    <div class="volume">
      <span class="board" />
      <span class="page-block" />
      <span class="leaf right-leaf"><i v-for="n in 5" :key="n" /></span>
      <span class="leaf turning-leaf"><i v-for="n in 4" :key="n" /></span>
      <span class="front-board">
        <span class="outer-board"><b>NIS Kitap</b></span>
        <span class="inner-board" />
      </span>
      <span class="ribbon" />
    </div>
  </div>
</template>

<style scoped>
.opening-book {
  --ink: #143754;
  --edge: #cab99a;
  --paper: #faf4e6;
  position: relative;
  container-type: inline-size;
  align-self: stretch;
  min-width: 0;
  min-height: clamp(240px, 30vw, 385px);
  perspective: 1100px;
  background: radial-gradient(ellipse at center, var(--accent-soft), transparent 68%);
}
.volume {
  position: absolute;
  width: min(37cqw, 188px);
  aspect-ratio: 0.78;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translateY(-51%) rotateX(16deg) rotateY(-9deg) rotateZ(-5deg);
  transform-origin: left center;
  transform-style: preserve-3d;
}
.board, .page-block, .leaf, .front-board, .outer-board, .inner-board {
  position: absolute;
  inset: 0;
  border-radius: 3px 11px 11px 3px;
}
.board, .outer-board, .inner-board { background: var(--ink); }
.board { box-shadow: 0 12px 28px #07152340; }
.page-block, .leaf { inset: 5px 6px 6px 0; }
.page-block { background: var(--edge); transform: translateZ(3px); }
.leaf {
  padding: 17% 14%;
  display: flex;
  flex-direction: column;
  gap: 7%;
  border: 1px solid #e0d0b4;
  background: linear-gradient(90deg, #d5c29d, var(--paper) 14%);
  transform-origin: left center;
}
.leaf i { display: block; width: 100%; height: 3px; border-radius: 3px; background: #ac987359; }
.leaf i:nth-child(3n) { width: 78%; }
.leaf i:last-child { width: 59%; }
.right-leaf { transform: translateZ(7px) rotateY(-5deg); }
.turning-leaf { transform: translateZ(9px) rotateY(-164deg); }
.front-board {
  transform: translateZ(5px) rotateY(-166deg);
  transform-origin: left center;
  transform-style: preserve-3d;
}
.outer-board {
  display: flex;
  align-items: end;
  padding: 15% 12%;
  color: #fff4dc;
  background: linear-gradient(90deg, #0a2540, var(--ink) 15%);
  font-family: var(--font-heading);
  font-size: clamp(1rem, 5.5cqw, 1.75rem);
  backface-visibility: hidden;
}
.outer-board b { padding-block-end: 8px; border-bottom: 2px solid #c49954; }
.inner-board { transform: rotateY(180deg); backface-visibility: hidden; }
.ribbon {
  position: absolute;
  inset: 81% auto auto 13%;
  width: 8%;
  height: 26%;
  transform: translateZ(11px) rotate(-12deg);
  background: #a77235;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);
}
.book-shadow {
  position: absolute;
  inset: 76% 10% 10%;
  background: radial-gradient(ellipse, #07152340, transparent 70%);
}
@media (prefers-reduced-motion: no-preference) {
  .front-board { animation: open-cover 1.25s var(--ease-out) 180ms both; }
  .turning-leaf { animation: turn-leaf 1.15s var(--ease-out) 340ms both; }
  @keyframes open-cover {
    from { transform: translateZ(13px) rotateY(0deg); }
    to { transform: translateZ(5px) rotateY(-166deg); }
  }
  @keyframes turn-leaf {
    from { transform: translateZ(9px) rotateY(0deg); }
    to { transform: translateZ(9px) rotateY(-164deg); }
  }
}
@media (max-width: 699px) {
  .opening-book { min-height: clamp(190px, 59vw, 260px); }
  .volume { width: min(33cqw, 144px); }
}
</style>
