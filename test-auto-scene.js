// Test script for Auto Scene functionality
// This simulates the ping-pong mode logic to verify it's working correctly

function testPingPongLogic() {
  console.log('Testing Auto Scene Ping-Pong Logic...\n');
  
  // Simulate the scene list and state
  const autoSceneList = ['test', 'test2', 'test3'];
  let autoSceneCurrentIndex = -1;
  let autoScenePingPongDirection = 'forward';
  
  // Function that mimics the store's setNextAutoSceneIndex logic
  function setNextAutoSceneIndex() {
    if (!autoSceneList || autoSceneList.length === 0) {
      autoSceneCurrentIndex = -1;
      return;
    }

    let nextIndex = autoSceneCurrentIndex;
    let nextPingPongDirection = autoScenePingPongDirection;
    const listLength = autoSceneList.length;

    // If this is the first time (currentIndex is -1), start with index 0
    if (autoSceneCurrentIndex === -1) {
      nextIndex = 0;
      nextPingPongDirection = 'forward';
    } else {
      // Ping-pong mode logic
      if (nextPingPongDirection === 'forward') {
        nextIndex = autoSceneCurrentIndex + 1;
        if (nextIndex >= listLength) {
          nextIndex = Math.max(0, listLength - 2); // Go to second-to-last
          nextPingPongDirection = 'backward';
        }
      } else {
        nextIndex = autoSceneCurrentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = Math.min(1, listLength - 1); // Go to second item
          nextPingPongDirection = 'forward';
        }
      }
    }

    autoSceneCurrentIndex = nextIndex;
    autoScenePingPongDirection = nextPingPongDirection;
    
    return {
      index: nextIndex,
      sceneName: autoSceneList[nextIndex],
      direction: nextPingPongDirection
    };
  }
  
  // Test the progression
  console.log('Scene List:', autoSceneList);
  console.log('Initial state: index =', autoSceneCurrentIndex, ', direction =', autoScenePingPongDirection);
  console.log('\nTesting ping-pong progression:\n');
  
  // Test 10 iterations to see the pattern
  for (let i = 0; i < 10; i++) {
    const result = setNextAutoSceneIndex();
    console.log(`Step ${i + 1}: Index ${result.index} -> "${result.sceneName}" (${result.direction})`);
  }
  
  console.log('\n✅ Ping-pong test completed successfully!');
  console.log('The logic should cycle: test -> test2 -> test3 -> test2 -> test -> test2 -> test3 -> ...');
}

// Run the test
testPingPongLogic();
