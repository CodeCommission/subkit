const { responsePathAsArray } = require("graphql");

class TracingExtension {
  constructor() {
    this.startWallTime;
    this.endWallTime;
    this.startHrTime;
    this.duration;
    this.resolverCalls = [];
  }

  requestDidStart() {
    this.startWallTime = new Date();
    this.startHrTime = process.hrtime();
  }

  executionDidStart() {}

  willResolveField(_source, _args, _context, info) {
    const resolverCall = {
      path: info.path,
      fieldName: info.fieldName,
      parentType: info.parentType,
      returnType: info.returnType,
      score: info.fieldNodes.reduce((s, n) => s + (parseInt(n.score) || 0), 0),
      startOffset: process.hrtime(this.startHrTime)
    };
    this.resolverCalls.push(resolverCall);

    return () => {
      resolverCall.endOffset = process.hrtime(this.startHrTime);
    };
  }

  didResolveField(_source, _args, _context, info) {}

  requestDidEnd() {
    this.duration = process.hrtime(this.startHrTime);
    this.endWallTime = new Date();
  }

  format() {
    return [
      "tracing",
      {
        version: 1,
        startTime: this.startWallTime.toISOString(),
        endTime: this.endWallTime.toISOString(),
        duration: durationHrTimeToNanos(this.duration),
        execution: {
          resolvers: this.resolverCalls.map(resolverCall => {
            const startOffset = durationHrTimeToNanos(resolverCall.startOffset);
            const duration = resolverCall.endOffset
              ? durationHrTimeToNanos(resolverCall.endOffset) - startOffset
              : 0;
            return {
              path: responsePathAsArray(resolverCall.path),
              parentType: resolverCall.parentType.toString(),
              fieldName: resolverCall.fieldName,
              score: resolverCall.score,
              returnType: resolverCall.returnType.toString(),
              startOffset,
              duration
            };
          })
        }
      }
    ];
  }
}

function durationHrTimeToNanos(hrtime) {
  return hrtime[0] * 1e9 + hrtime[1];
}

module.exports = { TracingExtension };
