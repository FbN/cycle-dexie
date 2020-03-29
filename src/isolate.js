import xs from 'xstream'
import { adapt } from '@cycle/run/lib/adapt'

function arrayEqual (requestNamespace = [], sourceNamespace = []) {
    for (let i = 0; i < sourceNamespace.length; i++) {
        if (requestNamespace[i] !== sourceNamespace[i]) {
            return false
        }
    }
    return true
}

export function isolateSource (dexieSource, scope) {
    if (scope === null) {
        return dexieSource
    }
    return dexieSource.filter(
        request =>
            Array.isArray(request._namespace) &&
            arrayEqual(
                request._namespace,
                dexieSource._namespace.concat(scope)
            ),
        scope
    )
}

export function isolateSink (request$, scope) {
    if (scope === null) {
        return request$
    }
    return adapt(
        xs.fromObservable(request$).map(req => ({
            ...req,
            _namespace: [scope, ...(req._namespace || [])]
        }))
    )
}
