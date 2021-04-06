import React, { MutableRefObject } from 'react';
import { getCoordinates } from 'utils/canvas.utils';
import { CanvasWidth, DrawingCanvasProviderProps } from './canvas.type';
import { CanvasRefContext } from './CanvasRefContext';
import useCanvasEventListener from './useCanvasEventListener';
import useCanvasPaint from './useCanvasPaint';

type DrawingCanvasContextProps = {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  size: CanvasWidth;
};

const DrawingCanvasContext = React.createContext<DrawingCanvasContextProps>(
  {} as any,
);

const canvasWidth = {
  width: 512,
  height: 320,
  border: 4,
  scale: 2,
  lineScale: 2,
};

export function DrawingCanvasProvider({
  color = '#900050',
  lineSize = 4,
  canvasSize: size = canvasWidth,
  children,
}: DrawingCanvasProviderProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = React.useState(false);

  const {
    paint,
    create,
    addLastLine,
    clear,
    undo,
    refresh,
    redo,
  } = useCanvasPaint({
    color,
    size: lineSize,
    canvasRef,
    scale: size.lineScale,
  });

  const onMouseDown = React.useCallback(
    (event: MouseEvent, isNewLine: boolean = true) => {
      const coordinates = getCoordinates(event, size.scale, canvasRef.current);
      if (!coordinates) return;
      setIsPainting(true);

      create(coordinates, isNewLine);
    },
    [canvasRef, create, size.scale],
  );

  const onMouseUp = React.useCallback(
    (event: MouseEvent) => {
      setIsPainting(false);
      const coordinate = getCoordinates(event, size.scale);
      addLastLine(coordinate);
    },
    [addLastLine, size.scale],
  );

  const onMouseEnter = React.useCallback(
    (event: MouseEvent) => {
      if (isPainting) onMouseDown(event, false);
    },
    [isPainting, onMouseDown],
  );

  const onMouseMove = React.useCallback(
    (event: MouseEvent) => {
      if (!isPainting || !canvasRef.current) return;
      const newMousePosition = getCoordinates(
        event,
        size.scale,
        canvasRef.current,
      );
      paint(newMousePosition);
    },
    [canvasRef, isPainting, paint, size.scale],
  );

  useCanvasEventListener({
    canvasRef,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseMove,
    isPainting,
  });

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;

    canvas.width = size.width * size.scale;
    canvas.height = size.height * size.scale;
    refresh();
  }, [canvasRef, refresh, size]);

  const values = React.useMemo(() => ({ clear, undo, canvasRef, redo, size }), [
    clear,
    size,
    redo,
    undo,
  ]);
  const canvasRefValues = React.useMemo(() => ({ canvasRef }), [canvasRef]);

  return (
    <DrawingCanvasContext.Provider value={values}>
      <CanvasRefContext.Provider value={canvasRefValues}>
        {children}
      </CanvasRefContext.Provider>
    </DrawingCanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = React.useContext(DrawingCanvasContext);
  if (!context)
    throw new Error(
      'useCanvasContext should be used within a DrawingCanvasContext',
    );
  return context;
}
