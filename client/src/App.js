import Brushing from "./components/Brushing";



function App() {
  const PATH = "http://gpu.hcil.snu.ac.kr:5000/";
  return (
    <div className="App">
      <Brushing 
        url={PATH}
        size={500}
        dataset={"mnist"}
        method={"pca"}
        sample={5}
      />
    </div>
  );
}

export default App;
