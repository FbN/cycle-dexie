import Dexie from 'dexie'
import { adapt } from '@cycle/run/lib/adapt'
import { isolateSource, isolateSink } from './isolate.js'

class DexieSource {
    constructor (_res$$ = xs.never(), _name = '', _namespace = []) {
        this._res$$ = _res$$ || xs.never()
        this._name = _name
        this._namespace = _namespace
        this.isolateSource = isolateSource
        this.isolateSink = isolateSink
    }

    filter (predicate, scope) {
        const filteredResponse$$ = this._res$$.filter(r$ =>
            predicate(r$.request)
        )
        return new DexieSource(
            filteredResponse$$,
            this._name,
            scope === undefined
                ? this._namespace
                : this._namespace.concat(scope)
        )
    }

    select (category) {
        const res$$ = category
            ? this._res$$.filter(
                res$ => res$.request && res$.request.category === category
            )
            : this._res$$
        const out = adapt(res$$)
        out._isCycleSource = this._name
        return out
    }
}

function requestInputToResponse$ (reqInput, db) {
    const response$ = xs.fromPromise(reqInput.query(db)).remember()
    response$ = adapt(response$)
    Object.defineProperty(response$, 'request', {
        value: reqInput,
        writable: false
    })
}

/** @type {(dbInit: (Dexie: Dexie) => db) => httpDriver} **/
export function makeDexieDriver (dbInit) {
    const db = dbInit(Dexie)
    return function (request$, name = 'DEXIE') {
        const response$$ = request$.map(requestInputToResponse$, db)
        const dexieSource = new DexieSource(response$$, name, [])
        response$$.addListener({
            next: () => {},
            error: () => {},
            complete: () => {}
        })
        return dexieSource
    }
}
