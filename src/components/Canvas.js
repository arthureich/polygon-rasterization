import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

const Canvas = () => {
  const [polygons, setPolygons] = useState([]);
  const [vertices, setVertices] = useState([]); // Array de todos os vértices
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [fillPolygons, setFillPolygons] = useState(true);
  const [drawEdges, setDrawEdges] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const canvasRef = useRef(null);

  const isPointInPolygon = (x, y, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Verificar se algum polígono foi clicado para seleção
    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i].map(vertexIndex => vertices[vertexIndex]); // Mapear os índices para os vértices reais
      console.log(polygon);
      if (isPointInPolygon(x, y, polygon)) {
        setSelectedPolygonIndex(i);
        return;
      }
    }

    const newVertex = { x, y, color: '#000000', edgeColor: 'yellow' };
    const newVertexIndex = vertices.length; // O índice do novo vértice
    setVertices(prevVertices => [...prevVertices, newVertex]); // Adicionar o vértice ao array de vértices

    const updatedPolygon = [...currentPolygon, newVertexIndex]; // Adicionar o índice do vértice ao polígono atual
    setCurrentPolygon(updatedPolygon);
    setClickCount(updatedPolygon.length);
  };

  const edges = [];

  const drawPolygonEdges = (polygonVertices, context) => {
    context.lineWidth = 3; // Define a espessura da linha para todas as arestas

    for (let i = 0; i < polygonVertices.length; i++) {
        // Obter vértices atuais e o próximo (ou o primeiro se for o último vértice)
        let current_vertice = vertices[polygonVertices[i]];
        let next_vertice = vertices[polygonVertices[(i + 1) % polygonVertices.length]];
        let xA = current_vertice.coordinate_x;
        let yA = current_vertice.coordinate_y;
        let xB = next_vertice.coordinate_x;
        let yB = next_vertice.coordinate_y;

        edges.push({
          xA, yA, xB, yB, 
          edgeColor: current_vertice.edgeColor || 'yellow'
      });

        // Taxa de Incremento 
        const dx = xB - xA;
        const dy = yB - yA;

        // Tratamento de divisão por zero no caso de dy == 0 (linha horizontal)
        const Tx = dy !== 0 ? dx / dy : 0;

        context.strokeStyle = current_vertice.edgeColor || 'yellow';
        context.beginPath(); 
        // Desenha de A para B se yA < yB, ou de B para A se yA > yB
        if (yA < yB) {
          while (yA < yB) {
              context.moveTo(Math.round(xA), Math.round(yA));
              xA += Tx;
              yA += 1;
              context.lineTo(Math.round(xA), Math.round(yA));
          }
      } else {
          while (yA > yB) {
              context.moveTo(Math.round(xA), Math.round(yA));
              xA -= Tx;
              yA -= 1;
              context.lineTo(Math.round(xA), Math.round(yA));
          }
      }

      context.stroke();
      context.closePath();
  }


    context.strokeStyle = vertices[polygonVertices[0]].edgeColor || 'yellow';
    context.beginPath();
    context.moveTo(vertices[polygonVertices[0]].x, vertices[polygonVertices[0]].y);
    polygonVertices.forEach(index => context.lineTo(vertices[index].x, vertices[index].y));
    context.closePath();
    if (drawEdges) context.stroke();
  };

  const fillPolygon = (array_scanline, poligono_ymin, context, color) => {
    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = 1;

    array_scanline.forEach((x_intersection, y_index) => {
        if (x_intersection.length > 0) {
            context.beginPath();
            for (let i = 0; i < x_intersection.length; i += 2) {
                const x_ini = x_intersection[i];
                const x_fim = x_intersection[i + 1];

                if (x_ini !== undefined && x_fim !== undefined) {
                    context.fillRect(Math.ceil(x_ini), (y_index + poligono_ymin[0]), Math.floor(x_fim - x_ini), 1);
                }
            }
            context.stroke();
        }
    });
    context.closePath(); 
  };


  const fillPolygonWithScanlines = (polygonVertices, context) => {
    polygonVertices = polygonVertices.map(index => vertices[index]);
    console.log(polygonVertices);
    let vertex_ymin = 0, vertex_ymax = 0; 
    let dx = 0, dy = 0, Tx = 0, Px = 0;
    let polygon_ymin = [];
    const Y_values = polygonVertices.map(obj => obj.y);
    const Y_max = Math.max(...Y_values);
    const Y_min = Math.min(...Y_values);
    polygon_ymin.push(Y_min);
    const scanlines = Y_max - Y_min;
    const polygon = polygonVertices;
    let array_scanline = Array(scanlines).fill(null).map(() => []);
    // Itera sobre as scanlines
    for (let i = 0; i <= polygon.length - 1; i++) {
      // dx, dy, Px
      if (i == polygon.length - 1) {
          dx = polygon[0].x - polygon[i].x;
          dy = polygon[0].y - polygon[i].y;

          // AB
          if (polygon[i].y < polygon[0].y) {
              Px = polygon[i].x;
              vertex_ymax = polygon[0].y;
              vertex_ymin = polygon[i].y;
          } else {
              // BA
              Px = polygon[0].x;
              vertex_ymax = polygon[i].y;
              vertex_ymin = polygon[0].y;
          }

      } 
      else {
          dx = polygon[i + 1].x - polygon[i].x;
          dy = polygon[i + 1].y - polygon[i].y;
          if (polygon[i].y < polygon[i + 1].y) {
              Px = polygon[i].x;
              vertex_ymax = polygon[i + 1].y;
              vertex_ymin = polygon[i].y;
          } else {
              Px = polygon[i + 1].x;
              vertex_ymax = polygon[i].y;
              vertex_ymin = polygon[i + 1].y;
          }

      }
      if (dy !== 0) {
          Tx = dx / dy;
      } else {
          Tx = 0;  // Aresta horizontal.
      }
      // Armazena intercecoes do eixo y em x.
      for (let j = vertex_ymin; j <= vertex_ymax - 1; j++) {
          array_scanline[j - polygon_ymin[0]].push(Px);
          Px = Px + Tx;
      }
  }
   array_scanline.forEach((intersections, index) => {
       if (intersections.length > 0) {
           array_scanline[index] = intersections.sort((a, b) => a - b);
       }
   });
   const poligono_color = polygonVertices[0].color;
   fillPolygon(array_scanline, polygon_ymin, context, poligono_color);

} 

  const finishPolygon = () => {
    if (currentPolygon.length >= 3) {
      setPolygons(prev => [...prev, currentPolygon]);
      setCurrentPolygon([]);
      setClickCount(0);
      drawCanvas();
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    polygons.forEach((polygon) => {
      fillPolygonWithScanlines(polygon, context);
      drawPolygonEdges(polygon, context);
    });

    if (currentPolygon.length > 0) {
      fillPolygonWithScanlines(currentPolygon, context);
      drawPolygonEdges(currentPolygon, context);
    }
  };

  const clearCanvas = () => {
    setPolygons([]);
    setVertices([]);
    setCurrentPolygon([]);
    setClickCount(0);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
      // Verifica se existe um polígono selecionado antes de tentar deletá-lo
  if (selectedPolygonIndex !== null) {
    deletePolygon(selectedPolygonIndex);
  }
};

  const deletePolygon = (index) => {
    const newPolygons = polygons.filter((_, i) => i !== index);
    setPolygons(newPolygons);
    setSelectedPolygonIndex(null);
    drawCanvas();
  };

  const changeColor = (polygonIndex, vertexIndex, color) => {
    const vertexId = polygons[polygonIndex][vertexIndex]; // Obter o índice do vértice real
    const updatedVertices = vertices.map((vertex, i) =>
      i === vertexId ? { ...vertex, color } : vertex
    );
    setVertices(updatedVertices);
    drawCanvas();
  };

  const handleEdgeToggle = () => {
    setDrawEdges(!drawEdges);
    drawCanvas();
  };

  useEffect(() => {
    drawCanvas();
  }, [polygons, vertices, fillPolygons, drawEdges]);

  const changeEdgeColor = (polygonIndex, color) => {
    // Faz uma cópia dos polígonos para não modificar o original diretamente
    const updatedPolygons = [...polygons];
  
    // Pega o polígono específico que queremos atualizar
    const polygon = updatedPolygons[polygonIndex];
  
    // Atualiza a cor das arestas (edgeColor) de cada vértice no polígono
    polygon.forEach(vertexIndex => {
      vertices[vertexIndex].edgeColor = color; // Atualiza diretamente a cor da aresta no array de vértices
    });
  
    // Atualiza o estado com os polígonos e vértices modificados
    setPolygons(updatedPolygons);
    setVertices([...vertices]); // Garante que a mudança nos vértices seja refletida no estado
  
    drawCanvas(); // Redesenha o canvas com as novas cores das arestas
  };
  

  useEffect(() => {
    drawCanvas();
  }, [polygons, fillPolygons, drawEdges]);

  return (
    <div className="canvas-container">
      <div className="topbar">
      <div className="click-counter">
           Clicks: {clickCount}
        </div>
        </div>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          width={800}
          height={600}
          style={{ border: '1px solid black' }}
        ></canvas>
        <button onClick={clearCanvas}>Clear</button>
        <button onClick={handleEdgeToggle}>{drawEdges ? 'Disable Edges' : 'Enable Edges'}</button>
        <button onClick={finishPolygon} disabled={clickCount < 3}>Finish Polygon</button>
      </div>
      {selectedPolygonIndex !== null && (
        <div className="sidebar">
          <h3>Selected Polygon {selectedPolygonIndex + 1}</h3>
          <div>
            Fill Color:
            <input type="color" onChange={(e) => changeColor(selectedPolygonIndex, 0, e.target.value)} />
          </div>
          <div>
            Edge Color:
            <input type="color" onChange={(e) => changeEdgeColor(selectedPolygonIndex, e.target.value)} />
          </div>
          <button onClick={() => deletePolygon(selectedPolygonIndex)}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default Canvas;