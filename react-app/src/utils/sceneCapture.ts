export const captureChannelValues = (
  getDmxChannelValue: (channel: number) => number,
  channelCount: number = 512
): number[] => {
  const channelValues = new Array(channelCount).fill(0);

  for (let i = 0; i < channelCount; i++) {
    const value = getDmxChannelValue(i);
    if (value > 0) {
      channelValues[i] = value;
    }
  }

  return channelValues;
};
