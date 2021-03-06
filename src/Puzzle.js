const assert = require("assert");
const clone = require('./util').clone;

class Puzzle {
  constructor(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    let initialState = this.mapData(data);
    this.initAccessors(initialState);
  }

  mapData(data) {
    this.rowHints = clone(data.rows);
    this.columnHints = clone(data.columns);
    this.height = this.rowHints.length;
    this.width = this.columnHints.length;
    if (data.content) {
      this.checkConsistency(data);
      this.originalContent = clone(data.content);
      return clone(data.content);
    }
    return Array(this.width * this.height).fill(0);
  }

  initAccessors(state) {
    const width = this.width;
    const height = this.height;

    let rows = Array(height);
    let makeRow = (rowIndex) => {
      let row = Array(width).fill(0);
      row.forEach((_, colIndex) => {
        Object.defineProperty(row, colIndex, {
          get() {
            return state[rowIndex * width + colIndex];
          },
          set(el) {
            state[rowIndex * width + colIndex] = el;
          }
        });
      });
      return row;
    };
    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
      let row = makeRow(rowIndex);
      Object.defineProperty(rows, rowIndex, {
        get() {
          return row;
        },
        set(newRow) {
          newRow.forEach((el, x) => state[rowIndex * width + x] = el);
        }
      });
    }

    let columns = Array(width);
    let makeColumn = (colIndex) => {
      let column = Array(height).fill(0);
      column.forEach((_, rowIndex) => {
        Object.defineProperty(column, rowIndex, {
          get() {
            return state[rowIndex * width + colIndex];
          },
          set(el) {
            state[rowIndex * width + colIndex] = el;
          }
        });
      });
      return column;
    };
    for (let colIndex = 0; colIndex < width; colIndex++) {
      let column = makeColumn(colIndex);
      Object.defineProperty(columns, colIndex, {
        get() {
          return column;
        },
        set(newCol) {
          newCol.forEach((el, y) => state[y * width + colIndex] = el);
        }
      });
    }

    Object.defineProperties(this, {
      rows: {
        get() {
          return rows;
        },
        set(newRows) {
          newRows.forEach((el, i) => {
            rows[i] = el;
          });
        }
      },
      columns: {
        get() {
          return columns;
        },
        set(cols) {
          cols.forEach((el, i) => {
            columns[i] = el;
          });
        }
      },
      isFinished: {
        get() {
          return state.every(item => item !== 0);
        }
      },
      snapshot: {
        get() {
          return clone(state);
        }
      },
      isSolved: {
        get() {
          let isOk = (line, hints) => {
            let actual = line.join('').split(/(?:-1)+/g).map(x => x.length).filter(x => x);
            return actual.length === hints.length && actual.every((x, i) => x === hints[i]);
          };
          return (
            this.isFinished &&
            columns.every((col, i) => isOk(col, this.columnHints[i])) &&
            rows.every((row, i) => isOk(row, this.rowHints[i]))
          );
        }
      }
    });

    this.import = function(puzzle) {
      state = clone(puzzle.snapshot);
    }
  }

  checkConsistency({content}) {
    let invalid = !content || !Array.isArray(content);
    invalid = invalid || (content.length !== this.height * this.width);
    invalid = invalid || !content.every(i => i === -1 || i === 0 || i === 1);
    assert(!invalid, 'Invalid content data');
  }
}

module.exports = Puzzle;
