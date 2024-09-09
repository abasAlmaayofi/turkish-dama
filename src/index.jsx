import { render } from "preact";

import preactLogo from "./assets/preact.svg";
import "./style.css";
import AppBoard from "./components/board";

export function App() {
  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 0 }}>
      <AppBoard />
      {/* <p>hello</p> */}
    </div>
  );
}

render(<App />, document.getElementById("app"));
