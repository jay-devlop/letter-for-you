import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

function Intro({ onNext }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="introOnly">
      {show ? (
        <button className="letterBtn" onClick={onNext} aria-label="Open letter">
          <img src="/love-letter.png" alt="" className="letterImg letterIntroAnim" />
        </button>
      ) : null}
    </div>
  );
}

function ValentineAsk({ onYes }) {
  const noTexts = useMemo(
    () => ["에이..", "ㅋㅋㅋ", "다시 생각해", "진짜로?", "너무해ㅠ", "저리가"],
    []
  );

  // ===== 요구사항 크기 =====
  const NO_W = 100;
  const NO_H = 48;
  const YES_BASE_W = 100;
  const YES_EXPANDED_W = 215;
  const GAP = 15;

  const [noIdx, setNoIdx] = useState(0);
  const [noMoved, setNoMoved] = useState(false);
  const [yesW, setYesW] = useState(YES_BASE_W);

  // 이동 NO의 위치(좌상단)
  const [noPos, setNoPos] = useState(() => ({
    x: Math.min(window.innerWidth - NO_W - 12, window.innerWidth / 2 + YES_BASE_W / 2 + GAP),
    y: Math.min(window.innerHeight - NO_H - 12, window.innerHeight / 2 + 40),
  }));

  // 마우스 좌표는 ref로 (렌더 폭증 방지)
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastTextTimeRef = useRef(0);

  // 화면 밖으로 안 나가게 clamp
  const clamp = (x, y) => {
    const padding = 12;
    const minX = padding;
    const minY = padding;
    const maxX = window.innerWidth - NO_W - padding;
    const maxY = window.innerHeight - NO_H - padding;
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  // 리사이즈 시 위치 보정
  useEffect(() => {
    const onResize = () => {
      setNoPos((p) => clamp(p.x, p.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마우스 추적
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // 미끄러지듯 회피 이동 (requestAnimationFrame)
  useEffect(() => {
    let rafId;

    const tick = () => {
      if (noMoved) {
        const triggerDist = 140;
        const { x: mx, y: my } = mouseRef.current;

        setNoPos((prev) => {
          const cx = prev.x + NO_W / 2;
          const cy = prev.y + NO_H / 2;

          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < triggerDist) {
            // 가까울수록 빨라짐 (미끄러지듯)
            const ux = dx / dist;
            const uy = dy / dist;
            const speed = 25 + (triggerDist - dist) * 0.10; // px/frame

            const next = clamp(prev.x + ux * speed, prev.y + uy * speed);

            // 문구 너무 빨리 바뀌지 않게(디바운스)
            const now = Date.now();
            if (now - lastTextTimeRef.current > 800) {
              lastTextTimeRef.current = now;
              setNoIdx((i) => (i + 1) % noTexts.length);
            }

            return next;
          }

          return prev;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noMoved]);

  // inline NO에 "가까이 가면" 이동 모드 시작 + YES 폭 확장(1회)
  const armEscape = () => {
    if (!noMoved) {
      setNoMoved(true);
      setYesW(YES_EXPANDED_W);
      setNoIdx((i) => (i + 1) % noTexts.length);
    }
  };

  return (
    <div className="mainWrap">
      <div className="mainCenter">
        <div className="emojiLine">🌹🍫💝</div>
        <div className="headline">윤하님이 문자를 보냈어요!</div>
        <div className="question">나랑 데이트할래?</div>

        <div className="btnRowInline" style={{ gap: `${GAP}px` }}>
          <button
            className="yesBtn"
            onClick={onYes}
            style={{ width: `${yesW}px`, height: `${NO_H}px` }}
          >
            ♥️ Yes ♥️
          </button>

          {!noMoved ? (
            <button
              className="noBtnInline"
              style={{ width: `${NO_W}px`, height: `${NO_H}px` }}
              onMouseEnter={armEscape}
              onMouseMove={armEscape}
            >
              💔 No 💔
            </button>
          ) : null}
        </div>

        {noMoved ? (
          <button
            className="noBtn"
            style={{ left: noPos.x, top: noPos.y, width: NO_W, height: NO_H }}
            aria-label="No"
          >
            {noTexts[noIdx]}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Result() {
  return (
    <div className="resultWrap">
      <img src="/ganadi.png" alt="" className="resultImg" />
      <div className="resultText">나도 좋아</div>
    </div>
  );
}


export default function App() {
  const [phase, setPhase] = useState("intro");

  if (phase === "intro") return <Intro onNext={() => setPhase("ask")} />;
  if (phase === "ask") return <ValentineAsk onYes={() => setPhase("result")} />;
  return <Result />;
}
