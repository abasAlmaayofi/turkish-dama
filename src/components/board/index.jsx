import { useEffect, useState } from "preact/hooks";
import "react-responsive-modal/styles.css";

import { Modal } from "react-responsive-modal";

import { IoClose } from "react-icons/io5";

import { Checkers, Utils } from "ymir-js";

const { Board } = Checkers.Turkish;
const { parseCoord } = Utils;

import style from "./board.module.css";
import { getVoice } from "../../utils";

import { useCountUp } from "react-countup";
import { useRef } from "react";

const board = new Board();

const listOfLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

const AppBoard = () => {
  const [turn, setTurn] = useState(0);
  const [move, setMove] = useState(0);
  const [activeColor, setActiveColor] = useState("black");
  const [activeCoord, setActiveCoord] = useState(null);
  const [boardMatrix, setBoardMatrix] = useState(board.getBoardMatrix());
  const [availableColumns, setAvailableColumns] = useState([]);
  const [openPlayAgain, setOpenPlayAgain] = useState(false);
  const [openStartGame, setOpenStartGame] = useState(true);
  const countUpRef = useRef(null);
  const [started, setStarted] = useState(false);

  const onOpenModalPlayAgain = () => setOpenPlayAgain(true);
  const onCloseModalPlayAgain = () => setOpenPlayAgain(false);

  const onOpenModalStartGame = () => setOpenStartGame(true);
  const onCloseModalStartGame = () => setOpenStartGame(true);

  const { start } = useCountUp({
    ref: countUpRef,
    start: 3,
    end: 0,
    duration: 3,
    // onStart: () => setStarted(true),
    onEnd: () => setOpenStartGame(false),
  });

  useEffect(() => {
    board.init();
    setBoardMatrix(board.getBoardMatrix());
  }, []);

  useEffect(() => {
    if (!activeCoord || activeColor === "white") {
      setAvailableColumns([]);
    } else {
      const activeItem = board.getItem(activeCoord);
      if (!activeItem) return;

      const columns = board.getAvailableColumns(
        activeCoord,
        activeItem.movement
      );
      setAvailableColumns(columns);
    }
  }, [activeCoord, activeColor]);

  const autoPlay = () => {
    board.autoPlay(activeColor, {
      onSelect: selectItem,
      onMove: (itemCoord, coord) => {
        setTimeout(() => moveItem(itemCoord, coord), 250);
      },
    });
  };

  const selectItem = (coord) => {
    const activeItem = board.getItem(coord);

    const successMoves = Object.keys(board.getAttackCoordsByColor(activeColor));

    if (successMoves.length && !successMoves.includes(coord)) {
      selectItem(successMoves[0]);
      return;
    }

    if (activeItem?.color !== activeColor) return;

    board.deselectAllItems();
    board.selectItem(coord);

    setActiveCoord(coord);
    getVoice("select").play();
  };

  const handleSelectItem = ({ target }) => {
    const { coord } = target.dataset;
    selectItem(coord);
  };

  const moveItem = (fromCoord, toCoord) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toRowId] = parseCoord(toCoord);
    console.log("available items", board.getItemsByColor("black").length);
    if (toRowId === 0 || toRowId === 7) {
      const activeItem = board.getItem(fromCoord);
      activeItem.setKing();
    }

    const coordsOfDestoryItems = board.getItemsBetweenTwoCoords(
      fromCoord,
      toCoord
    );

    const destroyedAnyItemsThisTurn = coordsOfDestoryItems.length > 0;

    board.moveItem(fromCoord, toCoord);

    if (destroyedAnyItemsThisTurn) {
      coordsOfDestoryItems.forEach((coord) => {
        getVoice("destroy").play();
        board.removeItem(coord);
      });
    }

    board.deselectAllItems();
    setBoardMatrix(board.getBoardMatrix());
    setActiveCoord(toCoord);

    const successMoves = Object.keys(
      board.getAttackCoordsByColor(activeColor)
    ).filter((moveCoord) => moveCoord === toCoord);

    if (
      !destroyedAnyItemsThisTurn ||
      (destroyedAnyItemsThisTurn && !successMoves.length)
    ) {
      setActiveColor(activeColor === "white" ? "black" : "white");
      setActiveCoord(null);
      setTurn(turn + 1);
      getVoice("move").play();
    } else {
      board.selectItem(toCoord);
    }
    setMove(move + 1);
  };

  const handleMoveItem = ({ target }) => {
    const { coord } = target.dataset;

    if (!availableColumns.includes(coord)) return;

    moveItem(activeCoord, coord);
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  useEffect(() => {
    const activeColorItems = board.getItemsByColor(activeColor);

    if (activeColorItems.length === 1) {
      const [lastItem] = activeColorItems;
      lastItem.setKing();
    }

    if (activeColor === "white") setTimeout(autoPlay, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (activeColorItems.length === 0) setOpenPlayAgain(true);
  }, [move]);

  return (
    <>
      <div
        style={{
          // backgroundColor: "red",
          // width: "100%",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
        className={style.board}
      >
        <div className={style.counterContainer}>
          <div className={style.counter}>
            <div
              style={{ position: "relative" }}
              className={`${style.counterItem} ${style.white}`}
            />
            <span>{board.getItemsByColor("white").length}</span>
          </div>
          <div className={style.counter}>
            <div
              style={{ position: "relative" }}
              className={`${style.counterItem} ${style.black}`}
            />
            {board.getItemsByColor("black").length}
          </div>
        </div>
        <div className={style.boardDelimiterNumbers}>
          <div className={style.numberContainer}>
            {listOfLetters.map((_, index) => (
              <div key={index} className={style.numbers}>
                {index + 1}
              </div>
            ))}
          </div>
          <div className={style.boardDelimiterLetters}>
            <div className={style.letterContainer}>
              {listOfLetters.map((letter, index) => (
                <div key={index} className={style.letter}>
                  {letter}
                </div>
              ))}
            </div>
            <div className={style.boardBorder}>
              {boardMatrix.map(
                (/** @type {{ coord: any; item: any; }[]} */ row) => (
                  <div key={row} class={style.row}>
                    {row.map(({ coord, item }) => (
                      <div
                        key={coord}
                        className={style.column}
                        data-coord={coord}
                        data-available={availableColumns.includes(coord)}
                        onClick={handleMoveItem}
                      >
                        {item && (
                          <div
                            className={`${style.item} ${
                              item.color === "black" ? style.black : style.white
                            }`}
                            onClick={handleSelectItem}
                            data-coord={coord}
                            data-color={item.color}
                            data-selected={item.selected}
                            data-king={item.king}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className={style.letterContainer}>
              {listOfLetters.map(
                (
                  letter,

                  index
                ) => (
                  <div className={style.letter}>{letter}</div>
                )
              )}
            </div>
          </div>
          <div className={style.numberContainer}>
            {listOfLetters.map((_, index) => (
              <div key={index} className={style.numbers}>
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* <div>
        <button onClick={onOpenModal}>Open modal</button>
      </div> */}

      <Modal
        styles={{ modal: { backgroundColor: "#e4b686", borderRadius: 20 } }}
        closeIcon={<IoClose size={20} color="#57250b" />}
        open={openPlayAgain}
        onClose={onCloseModalPlayAgain}
        center
      >
        <h2 style={{ color: "#57250b", fontSize: 20 }}>
          {board.getItemsByColor("black").length === 0
            ? "AI has won, you should take revenge!"
            : "congrats! you've won, you should win again!"}
        </h2>
        <button
          style={{
            backgroundColor: "#57250b",
            border: 0,
            borderRadius: 10,
            width: "80%",
            fontSize: 20,
            color: "white",
            padding: "10px 0px",
            marginLeft: "10%",
            fontWeight: "700",
            cursor: "pointer",
          }}
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
      </Modal>
      <Modal
        styles={{ modal: { backgroundColor: "#e4b686", borderRadius: 20 } }}
        // closeIcon={<IoClose size={20} color="#57250b" />}
        open={openStartGame}
        onClose={onCloseModalStartGame}
        showCloseIcon={false}
        center
      >
        <h2 style={{ color: "#57250b", fontSize: 20 }}>
          Game is under maintainance
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* {started ? ( */}
          {/* <span
            style={{ fontSize: 35, color: "#57250b", fontWeight: "700" }}
            ref={countUpRef}
          /> */}
          {/* // ) : ( */}
          {/* {!started && (
            <button
              style={{
                backgroundColor: "#57250b",
                border: 0,
                borderRadius: 10,
                width: "80%",
                fontSize: 20,
                color: "white",
                padding: "10px 0px",
                marginLeft: "5%",
                fontWeight: "700",
                cursor: "pointer",
              }}
              onClick={() => {
                start();
                setStarted(true);
              }}
            >
              Start
            </button>
          )}
          // )} */}
        </div>
      </Modal>
    </>
  );
};

export default AppBoard;
