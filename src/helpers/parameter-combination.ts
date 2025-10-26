// interface ParameterCombination {
//   temperature: number;
//   topP: number;
// };

// export function parameters(temperatures: number[], topPs: number[]): ParameterCombination[] {
//   const combinations: ParameterCombination[] = [];
//   for (const temperature of temperatures) {
//     for (const topP of topPs) {
//       combinations.push({ temperature, topP });
//     }
//   }
//   return combinations;
// }


interface ParameterCombination {
  temperature: number;
  topP: number;
  topK: number;
  maxToken: number;
}

export function parameters(
  temperatures: number[],
  topPs: number[],
  topKs: number[],
  maxTokens: number[]
): ParameterCombination[] {
  const arrays = [temperatures, topPs, topKs, maxTokens];

  const cartesian = (arrays: number[][]): number[][] =>
    arrays.reduce<number[][]>(
      (acc, curr) =>
        acc.flatMap(a => curr.map(b => [...a, b])),
      [[]]
    );

  return cartesian(arrays).map(([temperature, topP, topK, maxToken]) => ({
    temperature,
    topP,
    topK,
    maxToken,
  }));
}






