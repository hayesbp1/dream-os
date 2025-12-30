import { useState, useEffect, useRef, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { UploadSimple, Brain, WarningCircle, CheckCircle, ArrowCounterClockwise, CaretDown, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useChessAudio } from '../../hooks/useChessAudio';

const OPENINGS = [
    {
        name: "Sicilian Defense",
        variations: [
            { name: "Accelerated Dragon", moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6', 'c4'] },
            { name: "Najdorf Variation", moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] }
        ]
    },
    {
        name: "Ruy Lopez",
        variations: [
            { name: "Berlin Defense", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4'] },
            { name: "Morphy Defense", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] }
        ]
    },
    {
        name: "Queen's Gambit",
        variations: [
            { name: "Queen's Gambit Declined", moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'] },
            { name: "Slav Defense", moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4'] }
        ]
    },
    {
        name: "King's Indian Defense",
        variations: [
            { name: "Classical Variation", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6'] }
        ]
    },
    {
        name: "English Opening",
        variations: [
            { name: "Symmetrical Variation", moves: ['c4', 'c5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7'] }
        ]
    }
];

export function TheoryLab() {
    // Game State
    const [game, setGame] = useState(new Chess());
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [boardKey, setBoardKey] = useState(0);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

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

    // Handle Keyboard Navigation (only when not in trainer mode to avoid confusion)
    useEffect(() => {
        if (trainerMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentMoveIndex(prev => Math.min(history.length - 1, prev + 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history.length, trainerMode]);

    // Derive displayed position
    const safeIndex = Math.min(currentMoveIndex, history.length - 1);
    const displayedFen = safeIndex === -1 ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : history[safeIndex]?.after || game.fen();

    // Determine highlighting
    let lastMoveSource: string | undefined;
    let lastMoveTarget: string | undefined;
    if (safeIndex >= 0 && history[safeIndex]) {
        lastMoveSource = history[safeIndex].from;
        lastMoveTarget = history[safeIndex].to;
    }

    // --- Trainer Logic ---

    const startTrainer = (color: 'white' | 'black', line: string[]) => {
        console.log("Starting Trainer:", color);
        const newGame = new Chess();
        setGame(newGame);
        setOrientation(color);
        setUserColor(color);
        setTargetLine(line);
        setTrainerMode(true);
        setCurrentMoveIndex(-1);
        setBoardKey(k => k + 1);
        setFeedback({ type: 'info', message: 'Trainer Started. Good Luck!' });

        // If user is Black, computer (White) makes first move
        if (color === 'black') {
            setTimeout(() => {
                makeComputerMove(newGame, line, 0);
            }, 50);
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

    const makeComputerMove = (baseGame: Chess, line: string[], moveIndex: number) => {
        if (moveIndex >= line.length) {
            setFeedback({ type: 'success', message: 'Variation Complete!' });
            return;
        }

        setIsThinking(true);

        // BUG FIX: Must capture PGN, not FEN, to preserve history!
        const currentPgn = baseGame.pgn();

        setTimeout(() => {
            try {
                console.log("Computer attempting move index:", moveIndex, "Line:", line[moveIndex]);
                const nextGame = new Chess();
                nextGame.loadPgn(currentPgn);
                const moveSan = line[moveIndex];
                const move = nextGame.move(moveSan);

                if (move) {
                    console.log("Computer moved:", moveSan);
                    setGame(nextGame);
                    setCurrentMoveIndex(nextGame.history().length - 1);
                    setIsThinking(false);
                    move.flags.includes('c') ? playCapture() : playMove();
                } else {
                    console.error("Computer failed to make move:", moveSan);
                    setFeedback({ type: 'error', message: 'Trainer Error: Invalid Computer Move' });
                    setIsThinking(false);
                }
            } catch (e) {
                console.error("Computer move error", e);
                setIsThinking(false);
            }
        }, 50);
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        // Navigation lock
        if (currentMoveIndex !== history.length - 1 && history.length > 0) {
            return false;
        }

        // Trainer Turn Check
        if (trainerMode) {
            if (game.turn() === 'w' && userColor === 'black') return false;
            if (game.turn() === 'b' && userColor === 'white') return false;
        }

        try {
            // BUG FIX: Clone with PGN to keep history
            const tempGame = new Chess();
            tempGame.loadPgn(game.pgn());

            // Attempt move
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (!move) return false;

            // Trainer Validation
            if (trainerMode) {
                const nextMoveIndex = history.length; // The index of the move being played
                const expectedMove = targetLine[nextMoveIndex];

                if (move.san !== expectedMove) {
                    setFeedback({ type: 'error', message: `Incorrect. Expected: ${expectedMove}` });
                    // Reject move by not updating state
                    playError();
                    return false;
                } else {
                    setFeedback({ type: 'success', message: 'Correct!' });
                    playSuccess();
                }
            }

            // Apply move
            setGame(tempGame);
            setCurrentMoveIndex(tempGame.history().length - 1);

            // Trigger opponent response in Trainer Mode
            if (trainerMode) {
                makeComputerMove(tempGame, targetLine, tempGame.history().length);
                move.flags.includes('c') ? playCapture() : playMove();
            }

            if (tempGame.isGameOver()) {
                playGameOver();
            }

            return true;
        } catch (error) {
            return false;
        }
    };

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

    // Auto-scroll logic
    const activeMoveRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (activeMoveRef.current) {
            activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentMoveIndex]);

    const boardOptions = useMemo(() => ({
        position: displayedFen,
        onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) => targetSquare ? onDrop(sourceSquare, targetSquare) : false,
        canDragPiece: () => !isThinking && (trainerMode ? game.turn() === (userColor === 'white' ? 'w' : 'b') : currentMoveIndex === history.length - 1),
        boardOrientation: orientation,
        animationDurationInMs: 200,
        darkSquareStyle: { backgroundColor: 'rgba(37, 99, 235, 0.8)', backdropFilter: 'blur(4px)' },
        lightSquareStyle: { backgroundColor: 'rgba(240, 249, 255, 0.85)', backdropFilter: 'blur(4px)' },
        // @ts-ignore
        customSquareStyles: {
            ...(lastMoveSource && { [lastMoveSource]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }),
            ...(lastMoveTarget && { [lastMoveTarget]: { backgroundColor: 'rgba(255, 255, 0, 0.4)', boxShadow: 'inset 0 0 10px rgba(255,255,0,0.8)' } })
        }
    }), [displayedFen, isThinking, trainerMode, game, userColor, currentMoveIndex, history.length, orientation, lastMoveSource, lastMoveTarget]);

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
                                        setTrainerMode(false); // Reset trainer on change
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
                                        setTrainerMode(false); // Reset trainer on change
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
