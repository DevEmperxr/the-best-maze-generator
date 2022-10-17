const { timeStamp } = require('console');
const fs = require('fs');
const { globalAgent } = require('http');
const doc = require('pdfkit');
const PDFDocument = require('pdfkit');
const { cpuUsage } = require('process');

class PriorityQueue {
    constructor(){
        this.queue = []
    }
    qpush(cell , prio){
        if(this.queue.length == 0 ){
            this.queue.push([cell , prio])
        }else{
        for(let item of this.queue){
            if (prio >= item[1]){
                this.queue.splice(this.queue.indexOf(item), 0 , [cell, prio] )
            }

        }}
    }

    qpop(){
        return this.queue.pop()
    }
}

class Cell {
    constructor(x,y){
        this.x = x
        this.y = y
        this.info = [0,1,1]
    }
}
class Maze {
    constructor(rows, columns , solve){
        this.rows = rows
        this.columns = columns
        this.solve = solve
        this.grid = []
        let stack = []
        for (let r = 0 ; r < this.rows ;r++ ){
            for (let c = 0 ; c<this.columns ;c++){
                this.grid.push(new Cell(c,r))
            }
        }
        this.makeMaze()
        if (this.solve == true){
            this.solvepath = this.mazeSearch(this.getCell(0,0) , this.getCell(this.columns -1 , this.rows -1))
        }
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
        let unit = (this.rows > this.columns ? size/this.rows : size/this.columns)
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



       payload += `<line x1="${x}" y1="${y+(unit*this.rows)}" x2="${x+(unit*this.columns)}" y2="${y+(unit*this.rows)}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" /><line x1="${x+(unit*this.columns)}" y1="${y}" x2="${x+(unit*this.columns)}" y2="${y+(unit*(this.rows-1))}" stroke-linecap="square" style="stroke:${lineColor};stroke-width:${stroke}" /></svg>`
        if (fileExport == true){
            try {
                fs.writeFileSync('maze.svg', payload)
              } catch (err) {
                console.error(err);
              }
        }else{
        return payload
        }
    }

    exportPDF(doc, scale,stroke,color){
        doc.addPage()
        let [hwalls, vwalls] = this.wallList()
        let unit = (this.rows > this.columns ? (doc.page.height*scale/100)/this.rows : (doc.page.width*scale/100)/this.columns) 
        let x = (doc.page.width/2) - ((unit*this.columns) /2)
        let y = (doc.page.height/2) - ((unit*this.rows) /2)
        let x1 = 0
        let y1 = 0

        for (let wall of hwalls){
            if(wall[0] == 1 ){
                doc.moveTo((x1*unit) +x , y+ (y1*unit))
                doc.lineTo( (x1*unit) + (wall[1]*unit) + x , (y1*unit) +y)
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
                doc.moveTo((x1*unit) +x , (y1*unit)+y)
                doc.lineTo( x+ (x1*unit) , y + (y1*unit) + (wall[1]*unit))
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
        doc.moveTo(x+(unit*this.columns), y)
        doc.lineTo((unit*this.columns)+ x , unit*(this.rows-1) + y)
        doc.moveTo((unit*this.columns) + x , y+ (unit*(this.rows)))
        doc.lineTo(x,unit*this.rows + y).lineCap('round').lineWidth(stroke).strokeColor(color).stroke()
        if (this.solve == true){
            x1 = 0
            y1 = 0

            doc.addPage()
            for (let wall of hwalls){
                if(wall[0] == 1 ){
                    doc.moveTo((x1*unit) +x , y+ (y1*unit))
                    doc.lineTo( (x1*unit) + (wall[1]*unit) + x , (y1*unit) +y)
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
                    doc.moveTo((x1*unit) +x , (y1*unit)+y)
                    doc.lineTo( x+ (x1*unit) , y + (y1*unit) + (wall[1]*unit))
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
            doc.moveTo(x+(unit*this.columns), y)
            doc.lineTo((unit*this.columns)+ x , unit*(this.rows-1) + y)
            doc.moveTo((unit*this.columns) + x , y+ (unit*(this.rows)))
            doc.lineTo(x,unit*this.rows + y).lineCap('round').lineWidth(stroke).strokeColor(color).stroke()
            doc.moveTo(x + unit/2,y + unit/2 )
            for (let cell of this.solvepath){
                    // if (this.getCell(c,r).info[0] == 3){
                    //     doc.rect(x + c*unit + unit*0.3  , y + r* unit + unit*0.3   ,  unit - unit*0.6  ,unit - unit * 0.6).fill('#ff0000')
                    // }
                    if (cell.info[0] == 3){
                        doc.lineTo(cell.x*unit + x + unit/2 , cell.y*unit + y + unit/2)

                    }

                    // if (this.getCell(c,r).info[0] == 2){
                    //     doc.rect(x + c*unit + unit*0.3  , y + r* unit + unit*0.3   ,  unit - unit*0.6  ,unit - unit * 0.6).fill('#ff000')
                    // }
                    
                }
            
            doc.lineWidth(unit*0.63).strokeColor('#ff000').stroke()
        }
    }
    getAvailableCloseCells(cell){
        //console.log('neis of ')
        //console.log(cell)
        let ret = []
        if (cell.info[2] == 0 ){
            ret.push(this.getCell(cell.x -1 , cell.y))
        }
        if (cell.info[1] == 0 ){
            ret.push(this.getCell(cell.x, cell.y -1))
        }
        if (this.getCell(cell.x , cell.y +1 )!= undefined && this.getCell(cell.x , cell.y +1 ).info[1] == 0 ){
            ret.push(this.getCell(cell.x, cell.y +1 ))
        }
        if (this.getCell(cell.x +1, cell.y )!= undefined && this.getCell(cell.x +1 , cell.y ).info[2] == 0 ){
            ret.push(this.getCell(cell.x +1 , cell.y ))
        }
        ret = ret.filter(x => x.info[0] != 2)
        return ret
    }
    mazeSearch(start , goal){
        let path = []
        path.push(this.getCell(start.x , start.y))
        while (path.lenght != 0){
            let current = path[path.length -1 ]
            if (current == goal){
                current.info[0] =  3
                path.push(current)
                for( let cell of path){
                    cell.info[0] = 3
                }
                return path
            }else {
                current.info[0] = 2
                let neis = this.getAvailableCloseCells(current)
                if (neis.length == 0){
                    path.pop()
                }else {
                    path.push(neis[Math.floor(Math.random() * neis.length)])
                }
                
            }
        }
                    
                
      
    }
}
module.exports = Maze