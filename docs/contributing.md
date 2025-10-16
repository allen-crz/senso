# Contributing to Senso

Thank you for your interest in contributing to Senso! This guide will help you get started with contributing to the project.

## Ways to Contribute

There are many ways to contribute to Senso:

### Report Bugs
Found a bug? Please report it! Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device information

### Suggest Features
Have an idea for improvement? We'd love to hear it!
- Describe the feature
- Explain the use case
- Discuss potential implementation

### Improve Documentation
Documentation can always be better:
- Fix typos and errors
- Add missing information
- Improve clarity
- Add examples
- Translate to other languages

### Submit Code
Ready to code? Great!
- Fix bugs
- Implement features
- Improve performance
- Add tests
- Refactor code

## Getting Started

### Prerequisites

**Frontend Development:**
- Node.js 16+
- npm or yarn
- Git

**Backend Development:**
- Python 3.8+
- pip
- Virtual environment
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/senso.git
cd senso
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/senso.git
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run development server
python main.py
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

**Frontend:**
```bash
npm run lint        # Check code style
npm run build       # Test production build
```

**Backend:**
```bash
pytest              # Run tests
python -m pylint app  # Check code quality
```

### 4. Commit Changes

Write clear commit messages:
```bash
git add .
git commit -m "feat: add water meter OCR confidence scoring"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub:
1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template
5. Submit for review

## Code Style Guidelines

### Frontend (TypeScript/React)

**General:**
- Use TypeScript for type safety
- Follow ESLint configuration
- Use functional components with hooks
- Destructure props

**Example:**
```typescript
interface MeterReadingProps {
  value: number;
  timestamp: Date;
  utilityType: 'water' | 'electricity';
}

export const MeterReading: React.FC<MeterReadingProps> = ({
  value,
  timestamp,
  utilityType
}) => {
  const formattedDate = formatDate(timestamp);

  return (
    <div className="meter-reading">
      <span>{value}</span>
      <span>{formattedDate}</span>
    </div>
  );
};
```

**Naming:**
- Components: PascalCase
- Files: kebab-case or PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### Backend (Python/FastAPI)

**General:**
- Follow PEP 8 style guide
- Use type hints
- Write docstrings
- Keep functions focused

**Example:**
```python
from typing import List, Optional
from pydantic import BaseModel

class MeterReading(BaseModel):
    """Meter reading data model."""
    value: float
    timestamp: datetime
    utility_type: str

async def get_readings(
    user_id: str,
    limit: int = 10,
    offset: int = 0
) -> List[MeterReading]:
    """
    Retrieve meter readings for a user.

    Args:
        user_id: User identifier
        limit: Maximum number of readings
        offset: Pagination offset

    Returns:
        List of meter readings
    """
    # Implementation
    pass
```

**Naming:**
- Functions: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Private: _leading_underscore

## Testing Guidelines

### Frontend Tests

```typescript
import { render, screen } from '@testing-library/react';
import { MeterReading } from './MeterReading';

describe('MeterReading', () => {
  it('displays the reading value', () => {
    render(
      <MeterReading
        value={12345.67}
        timestamp={new Date()}
        utilityType="water"
      />
    );

    expect(screen.getByText('12345.67')).toBeInTheDocument();
  });
});
```

### Backend Tests

```python
import pytest
from app.services.meter_readings import calculate_consumption

def test_calculate_consumption():
    """Test consumption calculation."""
    current = 12345.67
    previous = 12300.00

    result = calculate_consumption(current, previous)

    assert result == 45.67
```

## Documentation Guidelines

### Code Documentation

**Use clear comments:**
```typescript
// Calculate daily average consumption over the billing cycle
const dailyAverage = totalConsumption / daysInCycle;
```

**Write helpful docstrings:**
```python
def detect_anomalies(readings: List[Reading]) -> List[Anomaly]:
    """
    Detect consumption anomalies using Isolation Forest.

    Requires minimum 10 readings for model training.
    Returns anomalies sorted by severity (highest first).

    Args:
        readings: List of meter readings with timestamps

    Returns:
        List of detected anomalies with severity scores

    Raises:
        ValueError: If fewer than 10 readings provided
    """
```

### User Documentation

When adding features, update:
- User Guide pages
- API documentation
- README if needed
- CHANGELOG

## Pull Request Guidelines

### PR Checklist

Before submitting:
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commits are clear and descriptive
- [ ] PR description explains changes
- [ ] No merge conflicts
- [ ] Builds successfully

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code reviewed
```

## Review Process

### What to Expect

1. **Automated checks** run on your PR
2. **Maintainer review** within a few days
3. **Feedback** if changes needed
4. **Approval** when ready
5. **Merge** into main branch

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address review comments"
git push origin your-branch-name
```

## Community Guidelines

### Be Respectful

- Be kind and courteous
- Respect different viewpoints
- Accept constructive criticism
- Focus on what's best for the project

### Be Clear

- Write clear descriptions
- Provide context
- Ask questions if unsure
- Help others understand

### Be Collaborative

- Welcome newcomers
- Share knowledge
- Credit contributors
- Celebrate successes

## Getting Help

### Stuck?

- Check existing issues
- Review documentation
- Ask in discussions
- Reach out to maintainers

### Resources

- [GitHub Issues](https://github.com/your-repo/senso/issues)
- [Discussions](https://github.com/your-repo/senso/discussions)
- [Documentation](https://your-docs-site.com)
- Community Chat (if available)

## Recognition

Contributors are recognized:
- In CONTRIBUTORS.md
- In release notes
- On project website
- Through GitHub badges

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

Don't hesitate to ask! We're here to help:
- Open a discussion
- Comment on issues
- Reach out to maintainers

Thank you for contributing to Senso!
