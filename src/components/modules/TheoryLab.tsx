import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { UploadSimple, Brain, WarningCircle, CheckCircle, ArrowCounterClockwise, CaretDown, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useChessAudio } from '../../hooks/useChessAudio';

const OPENINGS = [
    {
        name: "Sicilian Defense",
        variations: [
            {
                name: "Accelerated Dragon (Maroczy Bind)",
                moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6', 'c4', 'Bg7', 'Be3', 'Nf6', 'Nc3', 'Ng4', 'Qxg4', 'Nxd4', 'Qd1', 'Ne6', 'Qd2', 'd6', 'Be2']
            },
            {
                name: "Najdorf Variation (English Attack)",
                moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7', 'Qd2', 'O-O', 'O-O-O', 'Nbd7', 'g4', 'b5']
            }
        ]
    },
    {
        name: "Ruy Lopez",
        variations: [
            {
                name: "Berlin Defense (Endgame)",
                moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4', 'Nd6', 'Bxc6', 'dxc6', 'dxe5', 'Nf5', 'Qxd8+', 'Kxd8', 'Nc3', 'Ke8', 'h3', 'h5', 'Ne2']
            },
            {
                name: "Morphy Defense (Closed Main Line)",
                moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Na5', 'Bc2', 'c5', 'd4', 'Qc7', 'Nbd2', 'cxd4', 'cxd4', 'Bd7', 'Nf1']
            }
        ]
    },
    {
        name: "Queen's Gambit",
        variations: [
            {
                name: "Declined (Exchange Variation)",
                moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'c6', 'e3', 'Be7', 'Bd3', 'O-O', 'Qc2', 'Nbd7', 'Nge2', 'Re8', 'O-O', 'Nf8', 'h3', 'g6', 'Rab1']
            },
            {
                name: "Slav Defense (Main Line)",
                moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5', 'e3', 'e6', 'Bxc4', 'Bb4', 'O-O', 'O-O', 'Qe2', 'Bg6', 'Ne5', 'Nbd7', 'Nxg6', 'hxg6']
            }
        ]
    },
    {
        name: "King's Indian",
        variations: [
            {
                name: "Classical (Mar del Plata)",
                moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7', 'Ne1', 'Nd7', 'Be3', 'f5', 'f3', 'f4', 'Bf2', 'g5', 'Rc1', 'Ng6']
            },
            {
                name: "Sämisch Variation",
                moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3', 'O-O', 'Be3', 'Nc6', 'Qd2', 'a6', 'Nge2', 'Rb8', 'Nc1', 'e5', 'd5', 'Nd4', 'Nb3', 'Nxb3', 'axb3', 'c5']
            }
        ]
    },
    {
        name: "English Opening",
        variations: [
            {
                name: "Symmetrical (Four Knights)",
                moves: ['c4', 'c5', 'Nc3', 'Nc6', 'Nf3', 'Nf6', 'g3', 'g6', 'Bg2', 'Bg7', 'O-O', 'O-O', 'd4', 'cxd4', 'Nxd4', 'Nxd4', 'Qxd4', 'd6', 'Qd3', 'a6', 'Bd2', 'Rb8', 'Rac1']
            },
            {
                name: "Botvinnik System",
                moves: ['c4', 'e5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7', 'e4', 'd6', 'Nge2', 'Nge7', 'd3', 'O-O', 'O-O', 'f5', 'Nd5', 'Kh8', 'Be3', 'Nd4', 'Qd2', 'c6']
            }
        ]
    },
    {
        name: "Catalan Opening",
        variations: [
            {
                name: "Main Line (Closed)",
                moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O', 'dxc4', 'Qc2', 'a6', 'Qxc4', 'b5', 'Qc2', 'Bb7', 'Bd2', 'Be4', 'Qc1', 'c6', 'Bg5', 'h6', 'Bxf6', 'Bxf6', 'Nbd2']
            },
            {
                name: "Open Variation",
                moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'dxc4', 'Nf3', 'Be7', 'O-O', 'O-O', 'Qc2', 'a6', 'Qxc4', 'b5', 'Qc2', 'Bb7', 'Bd2', 'Be4', 'Qc1', 'Nc6', 'e3', 'Nb4', 'Bxb4', 'Bxb4', 'a3']
            }
        ]
    }
];

const THEME_PALETTES: Record<string, { dark: string, light: string }> = {
    'dream-teal': {
        light: 'rgba(207, 250, 254, 0.85)', // cyan-50
        dark: 'rgba(15, 118, 110, 0.85)'     // teal-700
    },
    'deep-space': {
        light: 'rgba(237, 233, 254, 0.85)', // violet-100
        dark: 'rgba(109, 40, 217, 0.85)'     // violet-700
    },
    'sunset-bliss': {
        light: 'rgba(255, 237, 213, 0.85)', // orange-100
        dark: 'rgba(190, 18, 60, 0.85)'      // rose-700
    },
    'midnight-glass': {
        light: 'rgba(226, 232, 240, 0.85)', // slate-200
        dark: 'rgba(51, 65, 85, 0.85)'      // slate-700
    }
};

interface TheoryLabProps {
    themeId?: string;
}

export function TheoryLab({ themeId = 'dream-teal' }: TheoryLabProps) {
    // Game State
    const [game, setGame] = useState(new Chess());
    const [displayedFen, setDisplayedFen] = useState(game.fen());
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [lastMoveSource, setLastMoveSource] = useState<string | null>(null);
    const [lastMoveTarget, setLastMoveTarget] = useState<string | null>(null);
    const [boardKey, setBoardKey] = useState(0); // Force re-render on reset

    // Trainer State
    const [trainerMode, setTrainerMode] = useState(false);
    const [userColor, setUserColor] = useState<'white' | 'black'>('white');
    const [targetLine, setTargetLine] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    // Opening Selection State
    const [selectedOpening, setSelectedOpening] = useState(OPENINGS[0]);
    const [selectedVariation, setSelectedVariation] = useState(OPENINGS[0].variations[0]);

    // Audio
    const { isMuted, volume, setVolume, toggleMute, playMove, playCapture, playSuccess, playError, playGameOver } = useChessAudio();

    // Get history for navigation
    const history = game.history({ verbose: true });

    // Get colors for current theme
    const colors = THEME_PALETTES[themeId] || THEME_PALETTES['dream-teal'];

    // Handle Keyboard Navigation (only when not in trainer mode to avoid confusion)
    useEffect(() => {
        if (trainerMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                navigateHistory('back');
            } else if (e.key === 'ArrowRight') {
                navigateHistory('forward');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentMoveIndex, trainerMode]);

    // Update displayed FEN based on move index
    useEffect(() => {
        if (currentMoveIndex === -1) {
            setDisplayedFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Explicit start FEN
            setLastMoveSource(null);
            setLastMoveTarget(null);
        } else {
            const move = history[currentMoveIndex];
            if (move) {
                setDisplayedFen(move.after);
                setLastMoveSource(move.from);
                setLastMoveTarget(move.to);
            }
        }
    }, [currentMoveIndex, game]);


    const makeComputerMove = (currentGame: Chess, line: string[], moveIndex: number) => {
        // Find next move in the line
        const expectedMoveSan = line[moveIndex];
        if (!expectedMoveSan) {
            setFeedback({ type: 'success', message: 'Line Complete! Well done.' });
            playSuccess();
            return;
        }

        setIsThinking(true);
        setTimeout(() => {
            try {
                // We need to apply the move to a copy of the game to get the valid move object
                const nextGame = new Chess();
                nextGame.loadPgn(currentGame.pgn());
                const move = nextGame.move(expectedMoveSan);

                if (move) {
                    console.log("Computer moved:", expectedMoveSan);
                    setGame(nextGame);
                    setCurrentMoveIndex(nextGame.history().length - 1);
                    setIsThinking(false);
                    move.flags.includes('c') ? playCapture() : playMove();
                } else {
                    console.error("Computer failed to make move:", expectedMoveSan);
                    setFeedback({ type: 'error', message: 'Trainer Error: Invalid Computer Move' });
                    setIsThinking(false);
                }
            } catch (e) {
                console.error("Trainer Error:", e);
                setFeedback({ type: 'error', message: 'Trainer Error: Move execution failed' });
                setIsThinking(false);
            }
        }, 50); // Small delay for realism
    };

    const startTrainer = (color: 'white' | 'black', line: string[]) => {
        setTrainerMode(true);
        setUserColor(color);
        setOrientation(color); // Visual flip
        setTargetLine(line);
        setFeedback({ type: 'info', message: `Trainer Active: Play ${color === 'white' ? 'White' : 'Black'}` });
        setGame(new Chess());
        setCurrentMoveIndex(-1);
        setBoardKey(k => k + 1); // Reset board state

        // If user is black, computer plays first move
        if (color === 'black') {
            makeComputerMove(new Chess(), line, 0);
        }
    };

    const stopTrainer = () => {
        if (trainerMode) {
            setTrainerMode(false);
            setFeedback(null);
        } else {
            // Setup generic reset if not in trainer mode
            const newGame = new Chess();
            setGame(newGame);
            setOrientation('white');
            setCurrentMoveIndex(-1);
            setBoardKey(k => k + 1);
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        if (isThinking) return false;

        // Trainer Logic
        if (trainerMode) {
            const currentHistory = game.history();
            const moveIndex = currentHistory.length;
            const expectedMove = targetLine[moveIndex];

            // If line is finished
            if (!expectedMove) {
                setFeedback({ type: 'success', message: 'Line Complete!' });
                return false;
            }

            // Create temp game to validate move
            const tempGame = new Chess();
            tempGame.loadPgn(game.pgn());

            try {
                const move = tempGame.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: 'q',
                });

                if (!move) return false;

                // Check against expected line
                if (move.san !== expectedMove) {
                    setFeedback({ type: 'error', message: `Incorrect. Expected: ${expectedMove}` });
                    // Reject move by not updating state
                    playError();
                    return false;
                } else {
                    setFeedback({ type: 'success', message: 'Correct!' });
                    playSuccess();
                }
            } catch (error) {
                return false;
            }

            // Updates for valid move
            setTimeout(() => {
                const nextGame = new Chess();
                nextGame.loadPgn(game.pgn());
                const validMove = nextGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
                if (validMove) {
                    setGame(nextGame);
                    setCurrentMoveIndex(nextGame.history().length - 1);

                    // Trigger opponent response in Trainer Mode
                    if (trainerMode) {
                        makeComputerMove(nextGame, targetLine, nextGame.history().length);
                    } else {
                        validMove.flags.includes('c') ? playCapture() : playMove();
                    }

                    if (nextGame.isGameOver()) {
                        playGameOver();
                    }
                }
            }, 0);
            return true;
        }

        // Free Play Logic (Original)
        try {
            const nextGame = new Chess();
            nextGame.loadPgn(game.pgn()); // Clone preserves history
            const move = nextGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // always promote to queen for simplicity
            });

            if (move === null) return false;

            setGame(nextGame);
            setCurrentMoveIndex(nextGame.history().length - 1);

            // Trigger opponent response in Trainer Mode
            if (trainerMode) {
                makeComputerMove(nextGame, targetLine, nextGame.history().length);
            } else {
                move.flags.includes('c') ? playCapture() : playMove();
            }

            if (nextGame.isGameOver()) {
                playGameOver();
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    // --- File Upload ---
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const pgn = e.target?.result as string;
            try {
                const newGame = new Chess();
                newGame.loadPgn(pgn);
                setGame(newGame);
                setOrientation('white');
                setTrainerMode(false); // Disable trainer on manual load
                setCurrentMoveIndex(newGame.history().length - 1);
                setBoardKey(k => k + 1);
            } catch (error) {
                alert("Invalid PGN file");
            }
        };
        reader.readAsText(file);
    };

    const navigateHistory = (direction: 'back' | 'forward' | 'start' | 'end') => {
        if (trainerMode) return;

        switch (direction) {
            case 'start':
                setCurrentMoveIndex(-1);
                break;
            case 'back':
                setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
                break;
            case 'forward':
                setCurrentMoveIndex(prev => Math.min(history.length - 1, prev + 1));
                break;
            case 'end':
                setCurrentMoveIndex(history.length - 1);
                break;
        }
    };

    // Auto-scroll logic
    const activeMoveRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (activeMoveRef.current) {
            activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentMoveIndex]);

    // Right-click highlight state
    const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, React.CSSProperties>>({});

    function onSquareRightClick(square: string) {
        const colour = 'rgba(255, 0, 0, 0.8)'; // More opacity
        setRightClickedSquares((squares) => {
            const newSquares = { ...squares };
            if (squares[square] && squares[square]?.backgroundColor === colour) {
                delete newSquares[square];
            } else {
                newSquares[square] = {
                    backgroundColor: colour
                };
            }
            return newSquares;
        });
    }

    // Memoize board options to prevent ghosting/re-renders
    const boardOptions = useMemo(() => ({
        position: displayedFen,
        onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) => targetSquare ? onDrop(sourceSquare, targetSquare) : false,
        onSquareRightClick: ({ square }: { square: string }) => onSquareRightClick(square),
        canDragPiece: () => !isThinking && (trainerMode ? game.turn() === (userColor === 'white' ? 'w' : 'b') : currentMoveIndex === history.length - 1),
        boardOrientation: orientation,
        animationDurationInMs: 200,
        darkSquareStyle: { backgroundColor: colors.dark, backdropFilter: 'blur(4px)' },
        lightSquareStyle: { backgroundColor: colors.light, backdropFilter: 'blur(4px)' },
        squareStyles: {
            ...rightClickedSquares,
            ...(lastMoveSource && { [lastMoveSource]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }),
            ...(lastMoveTarget && { [lastMoveTarget]: { backgroundColor: 'rgba(255, 255, 0, 0.4)', boxShadow: 'inset 0 0 10px rgba(255,255,0,0.8)' } })
        }
    }), [displayedFen, isThinking, trainerMode, game, userColor, currentMoveIndex, history.length, orientation, lastMoveSource, lastMoveTarget, colors, rightClickedSquares]);

    return (
        <div className="glass-panel p-6 rounded-3xl h-full flex flex-col relative overflow-hidden bg-black/20 border border-white/10">
            <div className="absolute top-0 left-0 right-0 h-20 glossy-overlay opacity-40 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                        <Brain weight="duotone" className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg tracking-wide">Theory Lab</h3>
                        {trainerMode && <span className="text-xs text-emerald-300 font-medium tracking-wide drop-shadow-md">Trainer Active ({orientation === 'white' ? 'White' : 'Black'})</span>}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Trainer Controls */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10 items-center gap-2">
                        {/* Opening Selector */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white/5 hover:bg-white/10 text-white text-xs pl-3 pr-8 py-1.5 rounded-md border border-white/10 outline-none focus:border-white/30 transition-all cursor-pointer min-w-[140px]"
                                value={selectedOpening.name}
                                onChange={(e) => {
                                    const opening = OPENINGS.find(o => o.name === e.target.value);
                                    if (opening) {
                                        setSelectedOpening(opening);
                                        setSelectedVariation(opening.variations[0]);
                                        setTrainerMode(false);
                                        setGame(new Chess());
                                        setCurrentMoveIndex(-1);
                                        setOrientation('white');
                                        setBoardKey(k => k + 1);
                                    }
                                }}
                            >
                                {OPENINGS.map(o => (
                                    <option key={o.name} value={o.name} className="bg-[#1a1a2e] text-white">{o.name}</option>
                                ))}
                            </select>
                            <CaretDown weight="duotone" className="w-3 h-3 text-white/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Variation Selector */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white/5 hover:bg-white/10 text-white/80 text-xs pl-3 pr-8 py-1.5 rounded-md border border-white/10 outline-none focus:border-white/30 transition-all cursor-pointer min-w-[160px]"
                                value={selectedVariation.name}
                                onChange={(e) => {
                                    const variation = selectedOpening.variations.find(v => v.name === e.target.value);
                                    if (variation) {
                                        setSelectedVariation(variation);
                                        setTrainerMode(false);
                                        setGame(new Chess());
                                        setCurrentMoveIndex(-1);
                                        setOrientation('white');
                                        setBoardKey(k => k + 1);
                                    }
                                }}
                            >
                                {selectedOpening.variations.map(v => (
                                    <option key={v.name} value={v.name} className="bg-[#1a1a2e] text-white">{v.name}</option>
                                ))}
                            </select>
                            <CaretDown weight="duotone" className="w-3 h-3 text-white/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        {/* Play Buttons */}
                        <button
                            onClick={() => startTrainer('white', selectedVariation.moves)}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${trainerMode && userColor === 'white' && targetLine === selectedVariation.moves ? 'bg-white/20 text-white shadow' : 'text-white/70 hover:bg-white/10'}`}
                        >
                            Play White
                        </button>
                        <button
                            onClick={() => startTrainer('black', selectedVariation.moves)}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${trainerMode && userColor === 'black' && targetLine === selectedVariation.moves ? 'bg-white/20 text-white shadow' : 'text-white/70 hover:bg-white/10'}`}
                        >
                            Play Black
                        </button>
                    </div>

                    {/* Audio & Reset Controls */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10 items-center gap-2 pr-2">
                        <div className="flex items-center gap-1 group">
                            <button
                                onClick={toggleMute}
                                className="p-2 hover:bg-white/10 text-white/50 hover:text-white/80 rounded-lg transition-colors"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <SpeakerSlash weight="duotone" className="w-4 h-4" /> : <SpeakerHigh weight="duotone" className="w-4 h-4" />}
                            </button>
                            {/* Volume Slider - Reveal on Hover/Always Visible depending on space */}
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30 accent-blue-500 transition-all opacity-50 group-hover:opacity-100"
                                title={`Volume: ${Math.round(volume * 100)}%`}
                            />
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <button
                            onClick={stopTrainer}
                            className="p-2 hover:bg-white/10 text-white/80 rounded-lg transition-all hover:scale-105 active:scale-95"
                            title={trainerMode ? "Exit Trainer" : "Reset Board"}
                        >
                            <ArrowCounterClockwise weight="duotone" className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white transition-colors cursor-pointer">
                        <UploadSimple weight="duotone" className="w-3 h-3" />
                        <span>PGN</span>
                        <input
                            type="file"
                            accept=".pgn"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            </div>

            {/* Feedback Bar */}
            {feedback && (
                <div className={`mb-4 px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 z-20 
                    ${feedback.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                        feedback.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
                            'bg-blue-500/20 border-blue-500/30 text-blue-200'}`}>
                    {feedback.type === 'error' ? <WarningCircle weight="duotone" className="w-4 h-4" /> :
                        feedback.type === 'success' ? <CheckCircle weight="duotone" className="w-4 h-4" /> :
                            <Brain weight="duotone" className="w-4 h-4 start-loading" />}
                    {feedback.message}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 relative z-20 min-h-0 w-full overflow-hidden">
                {/* Board */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="aspect-square h-full max-h-[50vh] md:max-h-[80vh] glass-panel p-4 rounded-2xl bg-black/20 overflow-hidden shadow-2xl border border-white/30 relative flex items-center justify-center">
                        <div className="w-full h-full">
                            <Chessboard
                                key={boardKey}
                                options={boardOptions}
                            />
                        </div>

                        {/* Debug Hint */}
                        <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/40 text-[10px] text-white/30 font-mono pointer-events-none">
                            {displayedFen.split(' ')[0]}
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="w-full md:w-64 glass-panel rounded-2xl bg-black/20 border border-white/10 flex flex-col overflow-hidden flex-shrink-0 h-48 md:h-auto">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h4 className="text-white/80 text-sm font-medium">Move List</h4>
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">{history.length} Plies</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-2 gap-y-1 text-sm text-white/70">
                            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => {
                                const whiteMoveIndex = i * 2;
                                const blackMoveIndex = i * 2 + 1;
                                const isWhiteActive = currentMoveIndex === whiteMoveIndex;
                                const isBlackActive = currentMoveIndex === blackMoveIndex;

                                return (
                                    <div key={i} className="contents group">
                                        <div className="text-white/30 text-right pr-2 py-1 font-mono text-xs">{i + 1}.</div>

                                        <div
                                            onClick={() => !trainerMode && setCurrentMoveIndex(whiteMoveIndex)}
                                            ref={isWhiteActive ? activeMoveRef : null}
                                            className={`rounded px-2 py-1 transition-all duration-200 flex items-center ${!trainerMode ? 'cursor-pointer hover:bg-white/10' : ''
                                                } ${isWhiteActive ? 'bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.3)] text-white font-medium scale-105' : 'bg-white/5'}`}
                                        >
                                            {history[whiteMoveIndex]?.san}
                                        </div>

                                        <div
                                            onClick={() => !trainerMode && history[blackMoveIndex] && setCurrentMoveIndex(blackMoveIndex)}
                                            ref={isBlackActive ? activeMoveRef : null}
                                            className={`rounded px-2 py-1 transition-all duration-200 flex items-center ${!trainerMode && history[blackMoveIndex] ? 'cursor-pointer hover:bg-white/10' : ''
                                                } ${isBlackActive ? 'bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.3)] text-white font-medium scale-105' : 'bg-white/5'}`}
                                        >
                                            {history[blackMoveIndex]?.san || ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
