# FoR Token Project Constitution

## Core Principles

### I. Decentralization First
**Every component must prioritize decentralization and immutability:**
- Smart contracts must be non-upgradeable unless explicitly justified
- No privileged roles (mint/burn) in token contracts unless required by specification
- Gas efficiency must be balanced against security and decentralization
- All contract interactions must be transparent and auditable

### II. Test-Driven Development (NON-NEGOTIABLE)
**TDD is mandatory for all code changes:**
- Tests written first → User approved → Tests fail → Then implement
- Red-Green-Refactor cycle strictly enforced
- Both Solidity and TypeScript tests required for smart contracts
- Unit tests must cover all functions including error conditions
- Integration tests required for contract interactions

### III. Security-First Design
**Security is paramount in all development:**
- Follow OpenZeppelin best practices and use audited libraries (OpenZeppelin Contracts v5)
- All external calls and state changes must be carefully reviewed
- Reentrancy guards where applicable
- Input validation on all public/external functions
- Comprehensive test coverage including edge cases and attack vectors

### IV. Standard Compliance
**Strict adherence to established standards:**
- ERC-20 standard compliance (full implementation of IERC20)
- ERC-2612 Permit functionality for gasless approvals
- Solidity version ^0.8.28 with latest security features
- Follow EIP specifications precisely, no custom deviations without justification

### V. Monorepo Organization & Modularity
**Clear separation of concerns in monorepo structure:**
- Each package must be self-contained and independently buildable
- Shared dependencies managed through workspace (pnpm)
- Clear interfaces between frontend and contract packages
- Documentation in each package README

## Technology Stack Requirements

### Smart Contract Development
- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat v3 (latest stable)
- **Libraries**: OpenZeppelin Contracts v5
- **Node Version**: >=18.18.0
- **Package Manager**: pnpm 9.12.0
- **Testing**: Hardhat (TypeScript + Solidity tests)

### Required Features
- Full ERC-20 implementation
- ERC-2612 Permit support (gasless approvals)
- Comprehensive test coverage (unit + integration)
- Gas optimization without compromising security
- Deployment scripts using Hardhat Ignition

### Code Quality
- TypeScript strict mode for all TypeScript code
- Solidity warnings treated as errors
- Linting with appropriate tools (eslint, solhint)
- Code coverage targets: >90% for contracts

## Development Workflow

### Branch Strategy
- Feature branches for all new work
- PR required before merging to main
- Branch naming: feature/*, fix/*, test/*

### Testing Requirements
1. **Unit Tests**
   - Test each function independently
   - Cover both success and failure cases
   - Test boundary conditions and edge cases
   
2. **Integration Tests**
   - Test contract interactions
   - Test deployment scenarios
   - Validate permit functionality end-to-end

3. **Test Execution**
   - All tests must pass before PR approval
   - No skipped tests in main branch
   - CI/CD integration for automated testing

### Code Review Process
- All changes require review before merge
- Checklist verification:
  - ✓ Tests written first and passing
  - ✓ Security considerations addressed
  - ✓ Gas optimization reviewed
  - ✓ Standard compliance verified
  - ✓ Documentation updated

### Documentation Standards
- All public functions must have NatSpec comments
- README updates for new features
- Deployment documentation maintained
- Architecture decisions documented

## Security & Quality Gates

### Pre-Deployment Checklist
- [ ] All tests passing (unit + integration)
- [ ] Code coverage meets targets
- [ ] Security review completed
- [ ] Gas optimization reviewed
- [ ] Standard compliance verified
- [ ] Documentation complete

### Deployment Standards
- Use Hardhat Ignition for deployments
- Verify contracts on block explorer
- Document deployment addresses
- Test on testnet before mainnet

## Governance

**This constitution supersedes all other development practices.**

### Amendment Process
- Amendments require documented justification
- Team approval required for changes
- Migration plan needed for breaking changes

### Compliance
- All PRs must verify constitution compliance
- Deviations require explicit justification and approval
- Complexity must be justified with clear benefits

### Specification-Driven Development
- Use `.specify` directory for specs and plans
- Feature development follows spec → plan → implement → verify workflow
- Specify CLI tools for project management and issue creation

**Version**: 1.0.0 | **Ratified**: 2025-12-20 | **Last Amended**: 2025-12-20
