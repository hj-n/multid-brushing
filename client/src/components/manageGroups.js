import React, { useRef, useEffect } from 'react';
import * as d3 from "d3";

const ManageGroups = (props) => {

  // const groupInfo = props.groupInfo;
  const groupInfo = [300, 200, 500, 700, 800, 900, 1, 1, 1, 1]
  const colors = props.colors;

  function addGroup() {

  }

  return (
    <div>
      <div>
        {groupInfo.map((num, idx) => (
            <button style={{
              backgroundColor: d3.rgb(colors[idx][0], colors[idx][1], colors[idx][2]),
              marginRight: 15,
              marginBottom: 10,
              width: 40,
              height: 40
            }}>{num}</button>
        ))}
      </div>
      <button onClick={addGroup}>Click to add another group</button>
    </div>
  )
}

export default ManageGroups;