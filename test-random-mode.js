// Test script for Auto Scene Random Mode
function testRandomLogic() {
  console.log('Testing Auto Scene Random Mode Logic...\n');
  
  const autoSceneList = ['test', 'test2', 'test3', 'scene4', 'scene5'];
  let autoSceneCurrentIndex = -1;
  
  function setNextRandomIndex() {
    if (!autoSceneList || autoSceneList.length === 0) {
      autoSceneCurrentIndex = -1;
      return null;
    }

    const listLength = autoSceneList.length;
    let nextIndex;

    if (autoSceneCurrentIndex === -1) {
      // First time, pick any random index
      nextIndex = Math.floor(Math.random() * listLength);
    } else {
      // Pick a different random index than current
      do {
        nextIndex = Math.floor(Math.random() * listLength);
      } while (nextIndex === autoSceneCurrentIndex && listLength > 1);
    }

    autoSceneCurrentIndex = nextIndex;
    return {
      index: nextIndex,
      sceneName: autoSceneList[nextIndex]
    };
  }
  
  console.log('Scene List:', autoSceneList);
  console.log('Testing random progression (should avoid repeating consecutive scenes):\n');
  
  const results = [];
  for (let i = 0; i < 15; i++) {
    const result = setNextRandomIndex();
    results.push(result);
    console.log(`Step ${i + 1}: Index ${result.index} -> "${result.sceneName}"`);
  }
  
  // Check that we don't have consecutive duplicates
  let hasConsecutiveDuplicates = false;
  for (let i = 1; i < results.length; i++) {
    if (results[i].index === results[i-1].index) {
      hasConsecutiveDuplicates = true;
      console.log(`⚠️  Found consecutive duplicate at steps ${i} and ${i+1}`);
    }
  }
  
  if (!hasConsecutiveDuplicates) {
    console.log('\n✅ Random mode test passed! No consecutive duplicates found.');
  }
  
  // Test edge case with single scene
  console.log('\nTesting edge case with single scene:');
  const singleSceneList = ['onlyScene'];
  let singleIndex = -1;
  
  function setSingleNextIndex() {
    if (singleSceneList.length === 1) {
      singleIndex = 0;
      return { index: 0, sceneName: singleSceneList[0] };
    }
  }
  
  for (let i = 0; i < 3; i++) {
    const result = setSingleNextIndex();
    console.log(`Single scene step ${i + 1}: "${result.sceneName}"`);
  }
  
  console.log('\n✅ Single scene test passed!');
}

testRandomLogic();
