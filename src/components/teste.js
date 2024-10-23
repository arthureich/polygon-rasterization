import React from 'react';
import ReactDOM from 'react-dom';
import Canvas from './Canvas'; // Importa o componente Canvas

const Teste = () => {
  return (
    <div>
      <h1>Teste Canvas</h1>
      <Canvas />
    </div>
  );
};

ReactDOM.render(<Teste />, document.getElementById('root'));
