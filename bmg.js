const fs = require('fs')

function cellFilter(cell){
    return cell != undefined
}

class Cell {
    constructor(x,y){
        this.x = x
        this.y = y
        this.info = [0,1,1]
    }
}

export default class Maze {
    constructor(rows, columns){
        this.rows = rows
        this.columns = columns
        this.grid = []
        let stack = []
        for (let r = 0 ; r < this.rows ;r++ ){
            for (let c = 0 ; c<this.columns ;c++){
                this.grid.push(new Cell(c,r))
            }
        }
        this.makeMaze()
    }

    getCell(x,y){
        return (x < 0|| y < 0 || y >= this.rows || x >= this.columns ? undefined : this.grid[y*this.columns + x])
    }

    getNei(cell,visited){
        let neis = [this.getCell(cell.x, cell.y+1),this.getCell(cell.x, cell.y-1),this.getCell(cell.x+1, cell.y),this.getCell(cell.x-1, cell.y)]
        return (visited ? neis.filter(cell => cell!= undefined).filter(x => x.info[0] == 0) : neis.filter(cell => cell!= undefined))

    }
    removeWalls(cell1,cell2){
        if (cell2.x - cell1.x === 1){
            cell2.info[2] = 0
        }
        if (cell2.x - cell1.x === -1){
            cell1.info[2] = 0
        }
        if (cell2.y - cell1.y === 1){
            cell2.info[1] = 0
        }
        if (cell2.y - cell1.y === -1){
            cell1.info[1] = 0
        }
    }

    makeMaze(){
        let stack = []
        let startCell = this.getCell(0,0)
        startCell.info[0] = 1
        stack.push(startCell)
        while(stack.length > 0){
            let current = stack.pop()
            let neis = this.getNei(current, true)
            if (neis.length > 0){
                stack.push(current)
                let next =  neis[Math.floor(Math.random() * neis.length)]
                this.removeWalls(current, next)
                next.info[0] = 1 
                stack.push(next)
            }
        }
        
        return this.grid        
    }

    wallList(){
        let Hwalls = []
        let Vwalls = []
        let wch = 0
        let bch = 0 
        let wcv = 0
        let bcv = 0
        for (let r = 0 ; r < this.rows ;r++ ){
            for (let c = 0 ; c<this.columns ;c++){
                let cell = this.getCell(c,r)
                if(cell.info[1] == 1 ){
                    if (bch != 0 ){
                        Hwalls.push([0 , bch])
                        bch = 0
                    }
                    wch+=1
                } else {
                    if (wch != 0 ){
                        Hwalls.push([1 , wch])
                        wch = 0
                    }
                    bch+=1
                }
            }
            if (bch != 0 ){
                Hwalls.push([0 , bch])
            }
            if (wch != 0 ){
                Hwalls.push([1 , wch])
            }
            wch = 0
            bch = 0
            Hwalls.push(['newHLine'])
        }
        for (let c = 0 ; c < this.columns ;c++ ){
            for (let r = 0 ; r<this.rows ;r++){
                let cell = this.getCell(c,r)
                if(cell.info[2] == 1 ){
                    if (bcv != 0 ){
                        Vwalls.push([0 , bcv])
                        bcv = 0
                    }
                    wcv+=1
                } else {
                    if (wcv != 0 ){
                        Vwalls.push([1 , wcv])
                        wcv = 0
                    }   
                    bcv+=1
                }
            }
            if (bcv != 0 ){
                Vwalls.push([0 , bcv])
            }
            if (wcv != 0 ){
                Vwalls.push([1 , wcv])
            }
            wcv = 0
            bcv = 0
            Vwalls.push(['newVLine'])
        }
        return [Hwalls, Vwalls]

    }



    exportSVG(x,y ,size, lineColor, stroke, fileExport){
        let payload = '<svg  version="1.1" xmlns="http://www.w3.org/2000/svg"  >'
        let [hwalls , vwalls] = this.wallList()
        let unit = size/this.columns
        let x1 = 0
        let y1 = 0

        for (let wall of hwalls){
            if(wall[0] == 1 ){
                payload+= `<line x1="${x+(x1*unit)}" y1="${(y1*unit)+ y}" x2="${x+((x1* unit) +wall[1]*unit)}" y2="${(y1*unit)+y}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" />`
                x1+= wall[1]
            }
            else if(wall[0] == 0 ){
                x1 += wall[1]
            }
            else if (wall[0]=='newHLine'){
                y1 += 1
                x1=0
            }
        }
        x1 = 0 
        y1 = 0
        for (let wall of vwalls){
            if(wall[0] == 1 ){
                payload+= `<line x1="${x+(x1*unit)}" y1="${y+ (y1*unit)}" x2="${x+(x1* unit)}" y2="${y+(y1*unit + wall[1]*unit)}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" />`
                y1+= wall[1]
            }
            else if(wall[0] == 0 ){
                y1 += wall[1]
            }
            else if (wall[0] == 'newVLine'){
                x1 += 1
                y1=0
            }
        }
       payload += `<line x1="${x}" y1="${y+(unit*this.rows)}" x2="${x+(unit*this.columns)}" y2="${y+(unit*this.rows)}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" /><line x1="${x+(unit*this.columns)}" y1="${y}" x2="${x+(unit*this.columns)}" y2="${y+(unit*this.rows)}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" /> </svg>`
        if (fileExport == true){
            try {
                fs.writeFileSync('maze.svg', payload)
              } catch (err) {
                console.error(err);
              }
        }
        
        return payload
    }
}
