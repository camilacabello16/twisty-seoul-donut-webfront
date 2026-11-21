import { useApp } from '../store'
import { Badge, PageHeader } from '../components/ui'
import { branches } from '../data'

export default function Settings() {
  const { t, L, lang, setLang, role, accounts, actions, notify } = useApp()
  const isOwner = role === 'owner'

  return (
    <>
      <PageHeader title={t('nav.settings')} sub={t('set.sub')} />

      <section className="panel">
        <h2>{t('set.language')}</h2>
        <div className="seg seg-lg" role="group" aria-label={t('set.language')}>
          <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>Tiếng Việt</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
        </div>
      </section>

      <section className="panel">
        <h2>{t('set.accounts')}</h2>
        <p className="muted small">{isOwner ? t('set.accountsOwner') : t('set.accountsReadonly')}</p>
        <div className="table-wrap flat">
          <table>
            <thead><tr><th>{t('hr.name')}</th><th>{t('set.role')}</th><th>{t('set.branches')}</th><th>{t('set.editCatalog')}</th></tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><Badge tone={a.role === 'owner' ? 'info' : 'neutral'}>{t(`role.${a.role}`)}</Badge></td>
                  <td>{a.branches.map((b) => L(branches.find((x) => x.id === b).name)).join(', ')}</td>
                  <td>
                    {a.role === 'owner' ? (
                      <Badge tone="ok">{t('common.yes')}</Badge>
                    ) : a.role === 'staff' ? (
                      <span className="muted">—</span>
                    ) : (
                      <label className="switch">
                        <input
                          type="checkbox" checked={a.canEditCatalog} disabled={!isOwner}
                          onChange={() => { actions.toggleCatalogRight(a.id); notify(t('common.saved')) }}
                          aria-label={`${t('set.editCatalog')}: ${a.name}`}
                        />
                        <span />
                      </label>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>{t('set.branches')}</h2>
        <ul className="plain">
          {branches.map((b) => <li key={b.id}><strong>{L(b.name)}</strong> <span className="muted">{b.address}</span></li>)}
        </ul>
      </section>

      <section className="panel">
        <h2>{t('set.general')}</h2>
        <dl className="kv">
          <dt>{t('set.currency')}</dt><dd>VND (₫)</dd>
          <dt>{t('set.timezone')}</dt><dd>Asia/Ho_Chi_Minh (UTC+7)</dd>
          <dt>{t('set.stdDays')}</dt><dd>26</dd>
        </dl>
      </section>
    </>
  )
}
