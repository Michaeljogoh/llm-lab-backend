import { Injectable } from '@nestjs/common';

type ResponseRow = {
  score: number;
  parameters: {
    temperature: number;
    topP: number;
    topK: number;
    maxToken: number;
  };
};

@Injectable()
export class SweepSuggestService {
  suggestNextSweep(
    responses: ResponseRow[],
    currentConfig: {
      temperature: number[];
      topP: number[];
      topK: number[];
      maxToken: number[];
    },
  ) {
    if (responses.length === 0) {
      return {
        message: 'No responses yet. Run a sweep first.',
        runConfig: currentConfig,
        topParameter: 'temperature',
      };
    }

    const best = responses.reduce((a, b) => (a.score >= b.score ? a : b));
    const impact = this.parameterImpact(responses);
    const topParameter = impact[0]?.name ?? 'temperature';

    const narrow = (values: number[], center: number, step: number, count = 3) => {
      const unique = [...new Set(values)].sort((a, b) => a - b);
      if (unique.length <= 1) {
        return [
          +Math.max(0, center - step).toFixed(2),
          +center.toFixed(2),
          +Math.min(1, center + step).toFixed(2),
        ].filter((v, i, arr) => arr.indexOf(v) === i);
      }
      const idx = unique.reduce(
        (bestIdx, val, i) =>
          Math.abs(val - center) < Math.abs(unique[bestIdx] - center)
            ? i
            : bestIdx,
        0,
      );
      const start = Math.max(0, idx - 1);
      return unique.slice(start, start + count);
    };

    const runConfig = {
      temperature: narrow(
        currentConfig.temperature,
        best.parameters.temperature,
        0.05,
      ),
      topP: narrow(currentConfig.topP, best.parameters.topP, 0.05),
      topK: narrow(currentConfig.topK, best.parameters.topK, 0.1),
      maxToken: narrow(
        currentConfig.maxToken,
        best.parameters.maxToken,
        50,
      ).map((v) => Math.round(v / 50) * 50 || 100),
    };

    return {
      message: `Scores vary most with ${topParameter}. Narrow the grid around the best variant (score ${best.score.toFixed(3)}).`,
      runConfig,
      topParameter,
    };
  }

  private parameterImpact(responses: ResponseRow[]) {
    const dims: Array<{
      name: string;
      key: keyof ResponseRow['parameters'];
    }> = [
      { name: 'temperature', key: 'temperature' },
      { name: 'topP', key: 'topP' },
      { name: 'topK', key: 'topK' },
      { name: 'maxToken', key: 'maxToken' },
    ];

    return dims
      .map(({ name, key }) => {
        const groups = new Map<number, number[]>();
        for (const row of responses) {
          const val = row.parameters[key];
          const list = groups.get(val) ?? [];
          list.push(row.score);
          groups.set(val, list);
        }
        const avgs = [...groups.values()].map(
          (scores) => scores.reduce((a, b) => a + b, 0) / scores.length,
        );
        const variance =
          avgs.length > 1
            ? Math.max(...avgs) - Math.min(...avgs)
            : 0;
        return { name, variance };
      })
      .sort((a, b) => b.variance - a.variance);
  }

  buildHeatmapData(responses: ResponseRow[]) {
    const cells = new Map<string, { sum: number; count: number }>();

    for (const row of responses) {
      const key = `${row.parameters.temperature}|${row.parameters.topP}`;
      const cell = cells.get(key) ?? { sum: 0, count: 0 };
      cell.sum += row.score;
      cell.count += 1;
      cells.set(key, cell);
    }

    return [...cells.entries()].map(([key, { sum, count }]) => {
      const [temperature, topP] = key.split('|').map(Number);
      return { temperature, topP, avgScore: +(sum / count).toFixed(3), count };
    });
  }
}
