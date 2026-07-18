import React, { useEffect, useState } from 'react'
import { getPredictiveBriefing } from '../api/aiApi'
import { createCommune, getCommunes, getProvinces } from '../api/locationApi'
import { createOfficialUser, getUsers } from '../api/userApi'
import Loader from '../components/Loader'

const initialUser = {
  username: '',
  email: '',
  password: '',
  role: 'autorite',
  organization: 'ECO RDC Intelligence',
}

const initialCommune = {
  province: '',
  name: '',
  code: '',
  centroid_latitude: '',
  centroid_longitude: '',
  ecological_score: 75,
  risk_level: 'moyen',
}

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [communes, setCommunes] = useState([])
  const [provinces, setProvinces] = useState([])
  const [briefing, setBriefing] = useState(null)
  const [form, setForm] = useState(initialUser)
  const [communeForm, setCommuneForm] = useState(initialCommune)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    const [userRows, ai, communeRows, provinceRows] = await Promise.all([
      getUsers().catch(() => []),
      getPredictiveBriefing().catch(() => ({ predictions: [] })),
      getCommunes().catch(() => []),
      getProvinces().catch(() => []),
    ])
    setUsers(userRows)
    setBriefing(ai)
    setCommunes(communeRows)
    setProvinces(provinceRows)
    setCommuneForm((current) => ({ ...current, province: current.province || provinceRows[0]?.id || '' }))
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateCommune = (field, value) => setCommuneForm((current) => ({ ...current, [field]: value }))

  const submitUser = async (event) => {
    event.preventDefault()
    setMessage('')
    await createOfficialUser(form)
    setForm(initialUser)
    setMessage('Compte officiel cree avec succes.')
    refresh()
  }

  const submitCommune = async (event) => {
    event.preventDefault()
    setMessage('')
    await createCommune({
      ...communeForm,
      centroid_latitude: Number(communeForm.centroid_latitude || -4.3225),
      centroid_longitude: Number(communeForm.centroid_longitude || 15.3222),
      ecological_score: Number(communeForm.ecological_score || 75),
    })
    setCommuneForm({ ...initialCommune, province: communeForm.province })
    setMessage('Commune ajoutee dans la base de donnees.')
    refresh()
  }

  if (loading) return <Loader message="Chargement supervision..." />

  return (
    <div className="eco-page-shell admin-dashboard">
      <h1 style={{ fontWeight: 800 }}>Supervision nationale</h1>
      <p style={{ color: 'var(--eco-text-secondary)' }}>Comptes officiels, prediction IA et controle institutionnel connectes au backend.</p>

      {message && (
        <div className="eco-card p-3 mb-3" style={{ borderColor: 'rgba(39,174,96,0.28)', color: '#237a4d' }}>
          <i className="bi bi-check-circle-fill me-2"></i>{message}
        </div>
      )}

      <div className="row g-4 my-2">
        <div className="col-lg-5">
          <form className="eco-card p-4 h-100" onSubmit={submitUser}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Creer un compte officiel</h3>
            <input className="eco-input mb-2" placeholder="Nom utilisateur" value={form.username} onChange={(event) => update('username', event.target.value)} required />
            <input className="eco-input mb-2" placeholder="Email institutionnel" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
            <input className="eco-input mb-2" placeholder="Mot de passe" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} required />
            <select className="eco-input mb-3" value={form.role} onChange={(event) => update('role', event.target.value)}>
              <option value="autorite">Autorite</option>
              <option value="ministere">Ministere</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn-eco btn w-100"><i className="bi bi-person-plus-fill me-2"></i>Creer le compte</button>
          </form>
        </div>

        <div className="col-lg-7">
          <section className="eco-card p-4 h-100">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Briefing predictif IA</h3>
            {(briefing?.predictions || []).slice(0, 6).map((item) => (
              <div key={item.commune_id || item.commune} className="admin-briefing-row d-flex justify-content-between py-2 border-bottom gap-3">
                <span>{item.commune}</span>
                <strong>{item.risk_score}% - {item.risk_level}</strong>
              </div>
            ))}
            {!(briefing?.predictions || []).length && (
              <div style={{ color: 'var(--eco-text-secondary)' }}>Aucune prediction disponible pour le moment.</div>
            )}
          </section>
        </div>
      </div>

      <div className="row g-4 my-2">
        <div className="col-lg-5">
          <form className="eco-card p-4 h-100" onSubmit={submitCommune}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Ajouter une commune</h3>
            <select className="eco-input mb-2" value={communeForm.province} onChange={(event) => updateCommune('province', event.target.value)} required>
              <option value="">Province</option>
              {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
            </select>
            <input className="eco-input mb-2" placeholder="Nom de la commune" value={communeForm.name} onChange={(event) => updateCommune('name', event.target.value)} required />
            <input className="eco-input mb-2" placeholder="Code court" value={communeForm.code} onChange={(event) => updateCommune('code', event.target.value)} required />
            <div className="row g-2">
              <div className="col-6">
                <input className="eco-input mb-2" placeholder="Latitude" value={communeForm.centroid_latitude} onChange={(event) => updateCommune('centroid_latitude', event.target.value)} />
              </div>
              <div className="col-6">
                <input className="eco-input mb-2" placeholder="Longitude" value={communeForm.centroid_longitude} onChange={(event) => updateCommune('centroid_longitude', event.target.value)} />
              </div>
            </div>
            <select className="eco-input mb-3" value={communeForm.risk_level} onChange={(event) => updateCommune('risk_level', event.target.value)}>
              <option value="faible">Risque faible</option>
              <option value="moyen">Risque moyen</option>
              <option value="eleve">Risque eleve</option>
              <option value="critique">Risque critique</option>
            </select>
            <button className="btn btn-outline-success w-100"><i className="bi bi-geo-alt-fill me-2"></i>Ajouter la commune</button>
          </form>
        </div>

        <div className="col-lg-7">
          <section className="eco-card p-4 h-100">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Communes referencees</h3>
            <div className="row g-2">
              {communes.map((commune) => (
                <div className="col-sm-6" key={commune.id}>
                  <div style={{ border: '1px solid var(--eco-border)', borderRadius: 8, padding: '10px 12px' }}>
                    <strong>{commune.name}</strong>
                    <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.8rem' }}>
                      {commune.provinceName || 'Province'} - risque {commune.risk || 'moyen'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="eco-card p-4 mt-4">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Utilisateurs</h3>
        <div className="table-responsive d-none d-md-block">
          <table className="eco-table">
            <thead><tr><th>Nom</th><th>Email</th><th>Role</th><th>Organisation</th></tr></thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}><td>{row.username}</td><td>{row.email}</td><td>{row.role}</td><td>{row.organization}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-md-none d-flex flex-column gap-2 mt-3">
          {users.map((row) => (
            <article className="eco-mobile-record" key={row.id}>
              <div className="d-flex align-items-start justify-content-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <strong>{row.username}</strong>
                  <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.email}
                  </div>
                </div>
                <span className="badge rounded-pill" style={{ background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)' }}>{row.role}</span>
              </div>
              <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.78rem', marginTop: 8 }}>
                {row.organization || 'Organisation non renseignee'}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
