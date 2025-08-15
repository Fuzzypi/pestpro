import os
import datetime
from flask import Flask, jsonify, request, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from ics import Calendar, Event

# --- APP INITIALIZATION ---
load_dotenv()
app = Flask(__name__)

# --- CORS SETUP ---
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# --- DATABASE CONFIGURATION ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a-fallback-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///pestpro.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    label = db.Column(db.String(100), nullable=True)
    address = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    is_primary = db.Column(db.Boolean, default=False)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    title = db.Column(db.String(100), nullable=True)
    is_primary = db.Column(db.Boolean, default=False)

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    # NEW: link a job to a property/contact (optional)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=True)
    contact_id  = db.Column(db.Integer, db.ForeignKey('contact.id'),  nullable=True)

    description = db.Column(db.String(500))
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Scheduled')
    job_date = db.Column(db.Date, nullable=False)
    job_time = db.Column(db.Time, nullable=True)

class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    currentStock = db.Column(db.Integer, default=0)
    minStock = db.Column(db.Integer, default=10)
    maxStock = db.Column(db.Integer, default=50)
    unitCost = db.Column(db.Float, default=0.0)
    sellingPrice = db.Column(db.Float, default=0.0)
    supplier = db.Column(db.String(100), nullable=True)
    lastOrdered = db.Column(db.Date, nullable=True)
    expirationDate = db.Column(db.Date, nullable=True)

class MarketingCampaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(50))
    audience = db.Column(db.String(50))
    status = db.Column(db.String(50), default='Draft')
    sent = db.Column(db.Integer, default=0)
    opened = db.Column(db.Integer, default=0)
    clicked = db.Column(db.Integer, default=0)
    revenue = db.Column(db.Float, default=0.0)
    createdDate = db.Column(db.Date)
    content_subject = db.Column(db.String(200))
    content_body = db.Column(db.Text)

# --- HELPERS / SERIALIZERS ---
def serialize_property(p: Property):
    return {
        "id": p.id,
        "label": p.label,
        "address": p.address,
        "notes": p.notes,
        "is_primary": bool(p.is_primary),
    }

def serialize_contact(c: Contact):
    return {
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "title": c.title,
        "is_primary": bool(c.is_primary),
    }

def format_job(job: Job):
    customer = Customer.query.get(job.customer_id)
    technician = User.query.get(job.technician_id) if job.technician_id else None
    prop = Property.query.get(job.property_id) if job.property_id else None
    contact = Contact.query.get(job.contact_id) if job.contact_id else None

    start_datetime = datetime.datetime.combine(
        job.job_date, job.job_time if job.job_time else datetime.time(9, 0)
    )
    payload = {
        "id": job.id,
        "title": f"{customer.name} - {job.description}",
        "start": start_datetime.isoformat(),
        "description": job.description,
        "notes": job.notes,
        "status": job.status,
        "job_date": job.job_date.isoformat(),
        "job_time": job.job_time.strftime('%H:%M') if job.job_time else None,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "address": customer.address,
            "phone": customer.phone,
            "email": customer.email,
        },
        "technician_id": job.technician_id,
        "resourceId": job.technician_id,
        "technician_name": technician.email.split('@')[0].capitalize() if technician else "Unassigned",
        "color": 'green' if job.status == 'Completed' else 'blue',
    }

    if prop:
        payload["property"] = serialize_property(prop)
    if contact:
        payload["contact"] = serialize_contact(contact)

    return payload

# --- API ENDPOINTS ---

@app.route('/api/calendar/<int:technician_id>/feed.ics')
def get_technician_calendar_feed(technician_id):
    technician = User.query.get_or_404(technician_id)
    jobs = Job.query.filter_by(technician_id=technician.id).filter(Job.status != 'Completed').all()
    cal = Calendar()
    for job in jobs:
        customer = Customer.query.get(job.customer_id)
        prop = Property.query.get(job.property_id) if job.property_id else None
        start_time = datetime.datetime.combine(job.job_date, job.job_time if job.job_time else datetime.time(9, 0))
        end_time = start_time + datetime.timedelta(hours=1)
        event = Event()
        event.name = f"Job: {job.description}"
        event.begin = start_time
        event.end = end_time
        loc_address = prop.address if prop else customer.address
        event.description = (
            f"Customer: {customer.name}\n"
            f"Address: {loc_address}\n"
            f"Phone: {customer.phone}\n"
            f"Notes: {job.notes or 'N/A'}"
        )
        event.location = loc_address
        cal.events.add(event)
    return Response(str(cal), mimetype='text/calendar')

@app.route('/api/customers/bulk-upload', methods=['POST'])
def bulk_upload_customers():
    data = request.get_json()
    customers_to_add = data.get('customers', [])
    errors = []
    added_count = 0
    skipped_count = 0
    for cust_data in customers_to_add:
        name = cust_data.get('name')
        address = cust_data.get('address')
        if not name:
            errors.append({"error": "Missing name", "data": cust_data})
            continue
        existing_customer = Customer.query.filter_by(name=name, address=address).first()
        if existing_customer:
            skipped_count += 1
            continue
        new_customer = Customer(
            name=name,
            address=address,
            phone=cust_data.get('phone'),
            email=cust_data.get('email')
        )
        db.session.add(new_customer)
        added_count += 1
    db.session.commit()
    return jsonify({
        "message": f"Processed {len(customers_to_add)} records. Added {added_count} new customers. Skipped {skipped_count} duplicates.",
        "errors": errors
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user:
        return jsonify({"message": "Login Successful", "user": {"email": user.email, "role": user.role}})
    return jsonify({"error": "User not found"}), 404

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        user_list = [{"id": u.id, "email": u.email, "role": u.role} for u in users]
        return jsonify(user_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('role'):
        return jsonify({"error": "Email and role are required"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "User with this email already exists"}), 409
    try:
        new_user = User(email=data['email'], role=data['role'])
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"id": new_user.id, "email": new_user.email, "role": new_user.role}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT', 'DELETE'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    if request.method == 'PUT':
        data = request.get_json()
        if 'role' in data:
            user.role = data['role']
        db.session.commit()
        return jsonify({"id": user.id, "email": user.email, "role": user.role})
    elif request.method == 'DELETE':
        if user.role == 'Admin' and User.query.filter_by(role='Admin').count() == 1:
            return jsonify({"error": "Cannot delete the last admin user"}), 400
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200

@app.route('/api/dashboard')
def dashboard_data():
    total_customers = Customer.query.count()
    total_jobs = Job.query.count()
    completed_jobs = Job.query.filter_by(status='Completed').count()
    scheduled_jobs = Job.query.filter_by(status='Scheduled').count()
    job_status_distribution = [
        {'name': 'Completed', 'value': completed_jobs},
        {'name': 'Scheduled', 'value': scheduled_jobs}
    ]
    recent_activity = [{
        "id": job.id, "type": "job",
        "description": f"Job #{job.id} ({job.description}) status: {job.status}"
    } for job in Job.query.order_by(Job.id.desc()).limit(3).all()]
    dashboard_payload = {
        "stats": {
            "totalCustomers": total_customers,
            "jobsToday": total_jobs,
            "revenueThisMonth": total_jobs * 150,
            "inventoryAlerts": 3
        },
        "revenueTrend": [
            {'name': 'Jan', 'revenue': 13000},
            {'name': 'Feb', 'revenue': 15500},
            {'name': 'Mar', 'revenue': 18000},
            {'name': 'Apr', 'revenue': 15000},
            {'name': 'May', 'revenue': 19000},
            {'name': 'Jun', 'revenue': 26000}
        ],
        "jobStatusDistribution": job_status_distribution,
        "recentActivity": recent_activity
    }
    return jsonify(dashboard_payload)

# --- JOBS ---
@app.route('/api/jobs', methods=['GET', 'POST'])
def handle_jobs():
    if request.method == 'POST':
        data = request.get_json() or {}
        try:
            # Required
            customer_id = int(data['customer_id'])
            description = data.get('description', '').strip()
            job_date_str = data.get('job_date')  # YYYY-MM-DD

            if not description:
                return jsonify({"error": "Description is required"}), 400
            if not job_date_str:
                return jsonify({"error": "job_date (YYYY-MM-DD) is required"}), 400

            job_date = datetime.date.fromisoformat(job_date_str)

            # Optional
            technician_id = data.get('technician_id')
            property_id = data.get('property_id')
            contact_id = data.get('contact_id')
            notes = data.get('notes')

            job_time = None
            if data.get('job_time'):
                # Expect HH:MM
                hh, mm = data['job_time'].split(':')
                job_time = datetime.time(int(hh), int(mm))

            new_job = Job(
                customer_id=customer_id,
                technician_id=technician_id,
                property_id=property_id,
                contact_id=contact_id,
                description=description,
                notes=notes,
                status='Scheduled',
                job_date=job_date,
                job_time=job_time
            )
            db.session.add(new_job)
            db.session.commit()
            return jsonify(format_job(new_job)), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    # GET
    jobs = Job.query.order_by(Job.job_date.desc()).all()
    return jsonify([format_job(job) for job in jobs])

@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    job = Job.query.get_or_404(job_id)
    data = request.get_json()
    try:
        job.customer_id = data.get('customer_id', job.customer_id)
        job.description = data.get('description', job.description)
        job.notes = data.get('notes', job.notes)
        job.status = data.get('status', job.status)
        if 'technician_id' in data: job.technician_id = data.get('technician_id')
        if 'property_id' in data: job.property_id = data.get('property_id')
        if 'contact_id' in data: job.contact_id = data.get('contact_id')
        if data.get('start'):
            new_start = datetime.datetime.fromisoformat(data['start'])
            job.job_date = new_start.date()
            job.job_time = new_start.time()
        if data.get('job_date'):
            job.job_date = datetime.date.fromisoformat(data['job_date'])
        if data.get('job_time'):
            hh, mm = data['job_time'].split(':')
            job.job_time = datetime.time(int(hh), int(mm))
        db.session.commit()
        return jsonify(format_job(job))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# --- CUSTOMERS (list/create) ---
@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({"error": "Customer name is required"}), 400

        new_customer = Customer(
            name=data['name'],
            address=data.get('address'),
            phone=data.get('phone'),
            email=data.get('email')
        )
        db.session.add(new_customer)
        db.session.commit()

        return jsonify({
            "id": new_customer.id, "name": new_customer.name,
            "address": new_customer.address, "phone": new_customer.phone,
            "email": new_customer.email
        }), 201

    customers = Customer.query.order_by(Customer.name).all()
    return jsonify([{
        "id": c.id, "name": c.name, "address": c.address, "phone": c.phone, "email": c.email
    } for c in customers])

# --- CUSTOMER DETAIL / UPDATE / DELETE ---
@app.route('/api/customers/<int:customer_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)

    if request.method == 'GET':
        jobs_query = Job.query.filter_by(customer_id=customer.id).order_by(Job.job_date.desc()).all()
        jobs_list = [format_job(job) for job in jobs_query]

        props = Property.query.filter_by(customer_id=customer.id).all()
        contacts = Contact.query.filter_by(customer_id=customer.id).all()

        customer_details = {
            "id": customer.id,
            "name": customer.name,
            "address": customer.address,
            "phone": customer.phone,
            "email": customer.email,
            "jobs": jobs_list,
            "properties": [serialize_property(p) for p in props],
            "contacts": [serialize_contact(c) for c in contacts],
        }
        return jsonify(customer_details)

    elif request.method == 'PUT':
        data = request.get_json()
        customer.name = data.get('name', customer.name)
        customer.address = data.get('address', customer.address)
        customer.phone = data.get('phone', customer.phone)
        customer.email = data.get('email', customer.email)
        db.session.commit()
        return jsonify({
            "id": customer.id, "name": customer.name,
            "address": customer.address, "phone": customer.phone, "email": customer.email
        })

    elif request.method == 'DELETE':
        if Job.query.filter_by(customer_id=customer_id).first():
            return jsonify({"error": "Cannot delete customer with active jobs."}), 400
        db.session.delete(customer)
        db.session.commit()
        return jsonify({"message": "Customer deleted successfully"}), 200

# --- PROPERTIES (create minimal for now) ---
@app.route('/api/customers/<int:customer_id>/properties', methods=['POST', 'GET'])
def customer_properties(customer_id):
    Customer.query.get_or_404(customer_id)

    if request.method == 'POST':
        data = request.get_json() or {}
        address = data.get('address', '').strip()
        if not address:
            return jsonify({"error": "Address is required"}), 400

        is_primary = bool(data.get('is_primary', False))
        if is_primary:
            # clear other primaries
            Property.query.filter_by(customer_id=customer_id, is_primary=True).update({"is_primary": False})

        prop = Property(
            customer_id=customer_id,
            label=data.get('label'),
            address=address,
            notes=data.get('notes'),
            is_primary=is_primary
        )
        db.session.add(prop)
        db.session.commit()
        return jsonify(serialize_property(prop)), 201

    # GET list
    props = Property.query.filter_by(customer_id=customer_id).all()
    return jsonify([serialize_property(p) for p in props])

# --- CONTACTS (create minimal for now) ---
@app.route('/api/customers/<int:customer_id>/contacts', methods=['POST', 'GET'])
def customer_contacts(customer_id):
    Customer.query.get_or_404(customer_id)

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        if not name:
            return jsonify({"error": "Name is required"}), 400

        is_primary = bool(data.get('is_primary', False))
        if is_primary:
            Contact.query.filter_by(customer_id=customer_id, is_primary=True).update({"is_primary": False})

        c = Contact(
            customer_id=customer_id,
            name=name,
            phone=data.get('phone'),
            email=data.get('email'),
            title=data.get('title'),
            is_primary=is_primary
        )
        db.session.add(c)
        db.session.commit()
        return jsonify(serialize_contact(c)), 201

    # GET list
    contacts = Contact.query.filter_by(customer_id=customer_id).all()
    return jsonify([serialize_contact(c) for c in contacts])

@app.route('/api/technicians')
def get_technicians():
    technicians = User.query.filter_by(role='Technician').all()
    return jsonify([{"id": tech.id, "title": tech.email.split('@')[0].capitalize()} for tech in technicians])

@app.route('/api/agenda/<string:date_str>')
def get_daily_agenda(date_str):
    try:
        target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        jobs_for_day = Job.query.filter_by(job_date=target_date).order_by(Job.job_time).all()
        return jsonify([format_job(job) for job in jobs_for_day])
    except Exception as e:
        return jsonify({"error": "Invalid date format or server error", "details": str(e)}), 400

@app.route('/api/inventory')
def get_inventory():
    try:
        items = Inventory.query.all()
        inventory_list = []
        for item in items:
            status = "In Stock"
            if item.currentStock <= item.minStock: status = "Low Stock"
            if item.currentStock == 0: status = "Out of Stock"
            inventory_list.append({
                "id": item.id, "name": item.name, "category": item.category,
                "currentStock": item.currentStock, "minStock": item.minStock,
                "maxStock": item.maxStock, "unitCost": item.unitCost,
                "sellingPrice": item.sellingPrice, "supplier": item.supplier,
                "lastOrdered": item.lastOrdered.isoformat() if item.lastOrdered else None,
                "expirationDate": item.expirationDate.isoformat() if item.expirationDate else None,
                "status": status
            })
        return jsonify(inventory_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports')
def get_reports_data():
    try:
        completed_jobs = Job.query.filter_by(status='Completed').count()
        scheduled_jobs = Job.query.filter_by(status='Scheduled').count()
        job_status_distribution = [
            {'name': 'Completed', 'value': completed_jobs},
            {'name': 'Scheduled', 'value': scheduled_jobs}
        ]
        revenue_trend = [
            {'name': 'Jan', 'revenue': 13000},
            {'name': 'Feb', 'revenue': 15500},
            {'name': 'Mar', 'revenue': 18000},
            {'name': 'Apr', 'revenue': 15000},
            {'name': 'May', 'revenue': 19000},
            {'name': 'Jun', 'revenue': 26000}
        ]
        jobs_per_technician = db.session.query(User.email, db.func.count(Job.id))\
            .join(Job, User.id == Job.technician_id).group_by(User.email).all()
        technician_performance = [
            {'name': email.split('@')[0].capitalize(), 'jobs': count}
            for email, count in jobs_per_technician
        ]
        reports_payload = {
            "jobStatusDistribution": job_status_distribution,
            "revenueTrend": revenue_trend,
            "technicianPerformance": technician_performance
        }
        return jsonify(reports_payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def format_campaign(c: MarketingCampaign):
    return {
        "id": c.id, "name": c.name, "type": c.type, "audience": c.audience,
        "status": c.status, "sent": c.sent, "opened": c.opened, "clicked": c.clicked,
        "revenue": c.revenue, "createdDate": c.createdDate.isoformat() if c.createdDate else None,
        "content": {"subject": c.content_subject, "content": c.content_body}
    }

@app.route('/api/marketing', methods=['GET', 'POST'])
def handle_marketing_campaigns():
    if request.method == 'POST':
        data = request.get_json()
        new_campaign = MarketingCampaign(
            name=data['name'], type=data['type'], audience=data['audience'],
            status='Draft', createdDate=datetime.date.today(),
            content_subject=data['content']['subject'], content_body=data['content']['content']
        )
        db.session.add(new_campaign)
        db.session.commit()
        return jsonify(format_campaign(new_campaign)), 201
    campaigns = MarketingCampaign.query.order_by(MarketingCampaign.createdDate.desc()).all()
    return jsonify([format_campaign(c) for c in campaigns])

def create_initial_data():
    with app.app_context():
        db.drop_all()
        db.create_all()

        today = datetime.date.today()

        # Users
        admin = User(email='admin@pestpro.com', role='Admin')
        tech1 = User(email='tech@pestpro.com', role='Technician')
        tech2 = User(email='dave@pestpro.com', role='Technician')
        db.session.add_all([admin, tech1, tech2])
        db.session.commit()

        # Customers
        customer1 = Customer(name='John Doe', address='123 Main St, Cleveland, OH', phone='216-555-0101', email='john.doe@example.com')
        customer2 = Customer(name='Jane Smith', address='456 Oak Ave, Cleveland, OH', phone='216-555-0102', email='jane.smith@example.com')
        db.session.add_all([customer1, customer2])
        db.session.commit()

        # Properties
        c1_home = Property(customer_id=customer1.id, label='Home', address='123 Main St, Cleveland, OH', is_primary=True)
        c2_home = Property(customer_id=customer2.id, label='Home', address='456 Oak Ave, Cleveland, OH', is_primary=True)
        db.session.add_all([c1_home, c2_home])

        # Contacts
        c1_primary = Contact(customer_id=customer1.id, name='John Doe', phone='216-555-0101', email='john.doe@example.com', is_primary=True)
        c2_primary = Contact(customer_id=customer2.id, name='Jane Smith', phone='216-555-0102', email='jane.smith@example.com', is_primary=True)
        db.session.add_all([c1_primary, c2_primary])
        db.session.commit()

        # Jobs
        job1 = Job(customer_id=customer1.id, technician_id=tech1.id, property_id=c1_home.id,
                   contact_id=c1_primary.id, description='Standard ant treatment',
                   job_date=today, job_time=datetime.time(9, 30), notes="Check under the sink.")
        job2 = Job(customer_id=customer2.id, technician_id=tech2.id, property_id=c2_home.id,
                   contact_id=c2_primary.id, description='Rodent inspection',
                   status='Completed', job_date=today - datetime.timedelta(days=1),
                   job_time=datetime.time(14, 0))
        job3 = Job(customer_id=customer1.id, technician_id=tech1.id, property_id=c1_home.id,
                   contact_id=c1_primary.id, description='Follow-up spider treatment',
                   job_date=today, job_time=datetime.time(11, 0))
        db.session.add_all([job1, job2, job3])

        # Inventory
        inv1 = Inventory(name='Termiticide Concentrate', category='Termiticides', currentStock=15, minStock=10, maxStock=50, unitCost=45.00, sellingPrice=75.00, supplier='PestChem Supply', lastOrdered=today - datetime.timedelta(days=15), expirationDate=today + datetime.timedelta(days=365))
        inv2 = Inventory(name='Bed Bug Spray', category='Insecticides', currentStock=5, minStock=8, maxStock=30, unitCost=25.00, sellingPrice=45.00, supplier='BugBuster Inc', lastOrdered=today - datetime.timedelta(days=20), expirationDate=today + datetime.timedelta(days=180))
        db.session.add_all([inv1, inv2])

        # Campaigns
        camp1 = MarketingCampaign(name='Summer Bed Bug Prevention', type='Email', audience='Residential', status='Active', sent=247, opened=98, clicked=23, revenue=3200, createdDate=today - datetime.timedelta(days=10))
        camp2 = MarketingCampaign(name='Commercial Quarterly Service', type='SMS', audience='Commercial', status='Completed', sent=45, opened=42, clicked=18, revenue=5400, createdDate=today - datetime.timedelta(days=15))
        db.session.add_all([camp1, camp2])
        db.session.commit()

        print("Database initialized with test data.")

# --- MAIN EXECUTION ---
if __name__ == '__main__':
    with app.app_context():
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if not os.path.exists(db_path):
            create_initial_data()
        else:
            try:
                # quick sanity checks; recreate if tables/cols missing
                Customer.query.with_entities(Customer.id).limit(1).all()
                Property.query.with_entities(Property.id).limit(1).all()
                Contact.query.with_entities(Contact.id).limit(1).all()
                Job.query.with_entities(Job.id).limit(1).all()
            except Exception:
                print("Schema appears outdated. Recreating database.")
                create_initial_data()
    app.run(host='0.0.0.0', port=5000, debug=True)
