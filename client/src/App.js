import Brushing from "./components/brushing";



function App() {
  const PATH = "http://127.0.0.1:5000/";
  return (
    <div className="App">
      <Brushing 
        url={PATH}
        dataset={"spheres"}
        method={"umap"}
        sample={5}
      />
    </div>
  );
}

export default App;
